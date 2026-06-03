import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Default seconds before re-hitting the 42 API for the same user. Override with
 * `LOGTIME_SYNC_THROTTLE_SECONDS` in .env (e.g. 5 to refresh almost every load,
 * 0 to never throttle — handy for near-live logtime).
 */
const DEFAULT_SYNC_THROTTLE_SECONDS = 60;
/** Give up on a 42 API call after this long so /me never hangs. */
const API_TIMEOUT_MS = 4_000;
/** Safety cap on pagination (100 sessions/page). */
const MAX_PAGES = 5;

interface Location {
  begin_at: string;
  end_at: string | null;
}

/**
 * Syncs a user's coins from their 42 logtime for the current month, computed
 * live from raw `locations` (sessions): each session counts until its `end_at`,
 * or until *now* when it is still open — so an active cluster session makes the
 * logtime tick up on every refresh. Uses an app token (`client_credentials`);
 * a student's own OAuth token is denied (403) on these endpoints.
 */
@Injectable()
export class FortyTwoService {
  private readonly logger = new Logger(FortyTwoService.name);
  private appToken: { value: string; expiresAt: number } | null = null;
  private readonly lastSync = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Refresh a user's coins from this month's 42 logtime. Throttled per user so
   * it can be called on every profile load; a no-op for non-42 accounts or on
   * API error.
   */
  async resyncCoins(userId: string): Promise<void> {
    const last = this.lastSync.get(userId) ?? 0;
    if (Date.now() - last < this.throttleMs()) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fortyTwoId: true },
    });
    if (!user?.fortyTwoId) return;
    this.lastSync.set(userId, Date.now());

    const hours = await this.fetchMonthLogtime(user.fortyTwoId);
    if (hours === null) return;

    const perHour =
      Number(this.config.get<string>('COINS_PER_HOUR', '1')) || 1;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        logtimeHours: hours,
        monthLogtimeHours: hours,
        coins: Math.floor(hours * perHour),
      },
    });
  }

  /** Live diagnostics for the current user's logtime fetch — never throws. */
  async debugLogtime(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fortyTwoId: true },
    });
    if (!user?.fortyTwoId) return { ok: false, reason: 'not a 42 account' };

    const token = await this.getAppToken();
    if (!token) {
      return { ok: false, reason: 'could not get 42 app token (check API_42_CLIENT_ID/SECRET)' };
    }

    const locations = await this.fetchMonthLocations(user.fortyTwoId, token);
    if (locations === null) return { ok: false, reason: 'locations request failed' };

    const open = locations.filter((l) => !l.end_at).length;
    return {
      ok: true,
      month: this.monthRange().label,
      sessions: locations.length,
      openSessions: open,
      monthHours: Math.round(this.sumSessions(locations) * 100) / 100,
      sample: locations.slice(0, 3),
    };
  }

  /** This month's logtime in hours (open session counts to now). null on error. */
  private async fetchMonthLogtime(fortyTwoId: number): Promise<number | null> {
    const token = await this.getAppToken();
    if (!token) return null;
    const locations = await this.fetchMonthLocations(fortyTwoId, token);
    if (locations === null) return null;
    return this.sumSessions(locations);
  }

  /** All of this month's sessions (paginated). null on a failed first page. */
  private async fetchMonthLocations(
    fortyTwoId: number,
    token: string,
  ): Promise<Location[] | null> {
    const { begin, end } = this.monthRange();
    const all: Location[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const params = new URLSearchParams();
      params.set('range[begin_at]', `${begin},${end}`);
      params.set('per_page', '100');
      params.set('page', String(page));
      const url =
        `https://api.intra.42.fr/v2/users/${fortyTwoId}/locations?${params}`;

      const res = await this.timedFetch(url, token);
      if (!res?.ok) {
        if (res) this.logger.warn(`42 locations: ${res.status}`);
        return page === 1 ? null : all;
      }
      const batch = (await res.json()) as Location[];
      if (!Array.isArray(batch) || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < 100) break;
    }
    return all;
  }

  /** Sum session durations in hours, treating an open session as ending now. */
  private sumSessions(locations: Location[]): number {
    const now = Date.now();
    let seconds = 0;
    for (const loc of locations) {
      const begin = new Date(loc.begin_at).getTime();
      const end = loc.end_at ? new Date(loc.end_at).getTime() : now;
      if (end > begin) seconds += (end - begin) / 1000;
    }
    return seconds / 3600;
  }

  /** Current calendar month as ISO bounds (seconds precision). */
  private monthRange(): { begin: string; end: string; label: string } {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59),
    );
    const fmt = (d: Date) => `${d.toISOString().slice(0, 19)}Z`;
    return {
      begin: fmt(start),
      end: fmt(end),
      label: start.toISOString().slice(0, 7),
    };
  }

  /** Cached client_credentials token for app-level reads. */
  private async getAppToken(): Promise<string | null> {
    if (this.appToken && this.appToken.expiresAt > Date.now() + 5_000) {
      return this.appToken.value;
    }
    const clientId = this.config.get<string>('API_42_CLIENT_ID');
    const clientSecret = this.config.get<string>('API_42_CLIENT_SECRET');
    if (!clientId || !clientSecret) return null;

    try {
      const res = await fetch('https://api.intra.42.fr/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.warn(`42 app token responded with ${res.status}`);
        return null;
      }
      const data = (await res.json()) as {
        access_token: string;
        expires_in: number;
      };
      this.appToken = {
        value: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1_000,
      };
      return this.appToken.value;
    } catch (err) {
      this.logger.warn(`Failed to get 42 app token: ${String(err)}`);
      return null;
    }
  }

  /** Throttle window in ms, from LOGTIME_SYNC_THROTTLE_SECONDS (default 60). */
  private throttleMs(): number {
    const seconds = Number(
      this.config.get<string>(
        'LOGTIME_SYNC_THROTTLE_SECONDS',
        String(DEFAULT_SYNC_THROTTLE_SECONDS),
      ),
    );
    return (Number.isFinite(seconds) ? seconds : DEFAULT_SYNC_THROTTLE_SECONDS) * 1000;
  }

  private async timedFetch(
    url: string,
    token: string,
  ): Promise<Response | null> {
    try {
      return await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });
    } catch (err) {
      this.logger.warn(`42 API request failed: ${String(err)}`);
      return null;
    }
  }
}
