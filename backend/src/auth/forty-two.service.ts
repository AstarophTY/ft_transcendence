import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_SYNC_THROTTLE_SECONDS = 3600;
const API_TIMEOUT_MS = 4_000;
/** Safety cap on pagination for the current month's open sessions. */
const MAX_PAGES = 5;

interface Location {
  begin_at: string;
  end_at: string | null;
}

/**
 * Syncs a user's coins from their ALL-TIME 42 logtime:
 * - `logtimeHours` = total hours on 42 clusters since account creation
 * - `monthLogtimeHours` = this calendar month only
 * - `coins` = floor(logtimeHours * rate)
 *
 * Uses `locations_stats` (aggregated by month) + current open session to avoid
 * paginating through every individual session. App token (client_credentials)
 * required — student OAuth tokens are denied on these endpoints.
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
   * Refresh a user's coins from all-time 42 logtime. Throttled per user so
   * it can be called on every profile load; a no-op for non-42 accounts or
   * on API error.
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

    const token = await this.getAppToken();
    if (!token) return;

    const { total, month } = await this.fetchLogtime(user.fortyTwoId, token);
    if (total === null) return;

    const perHour = Number(this.config.get<string>('COINS_PER_HOUR', '1')) || 1;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        logtimeHours: total,
        monthLogtimeHours: month ?? 0,
        coins: Math.floor(total * perHour),
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

    const { total, month, stats } = await this.fetchLogtime(user.fortyTwoId, token);
    return {
      ok: total !== null,
      totalHours: total !== null ? Math.round(total * 100) / 100 : null,
      monthHours: month !== null ? Math.round((month ?? 0) * 100) / 100 : null,
      statsMonths: stats ? Object.keys(stats).length : 0,
    };
  }

  /**
   * All-time + current-month logtime from the 42 API.
   * - `stats` endpoint gives completed months (aggregated, efficient)
   * - Current month's open sessions are fetched separately so the balance
   *   ticks up while a cluster session is active.
   */
  private async fetchLogtime(
    fortyTwoId: number,
    token: string,
  ): Promise<{ total: number | null; month: number | null; stats: Record<string, number> | null }> {
    const stats = await this.fetchLogtimeStats(fortyTwoId, token);
    if (stats === null) return { total: null, month: null, stats: null };

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Sum all past months (completed sessions from stats).
    let totalFromStats = 0;
    let monthFromStats = 0;
    for (const [key, value] of Object.entries(stats)) {
      if (typeof value !== 'number') continue;
      totalFromStats += value;
      if (key === currentMonth) monthFromStats = value;
    }

    // Add current-month open sessions (not yet reflected in stats).
    const openSessions = await this.fetchMonthLocations(fortyTwoId, token);
    const openHours = openSessions
      ? this.sumOpenSessions(openSessions)
      : 0;

    return {
      total: totalFromStats + openHours,
      month: monthFromStats + openHours,
      stats,
    };
  }

  /**
   * `GET /v2/users/:id/locations_stats` — returns { "YYYY-MM": hours } for
   * every month the user has ever had a completed cluster session.
   */
  private async fetchLogtimeStats(
    fortyTwoId: number,
    token: string,
  ): Promise<Record<string, number> | null> {
    const url = `https://api.intra.42.fr/v2/users/${fortyTwoId}/locations_stats`;
    const res = await this.timedFetch(url, token);
    if (!res?.ok) {
      if (res) this.logger.warn(`42 locations_stats: ${res.status}`);
      return null;
    }
    const data = await this.safeJson(res);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return data as Record<string, number>;
  }

  /** Current month's open sessions only (end_at is null). */
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
      const url = `https://api.intra.42.fr/v2/users/${fortyTwoId}/locations?${params}`;

      const res = await this.timedFetch(url, token);
      if (!res?.ok) {
        if (res) this.logger.warn(`42 locations: ${res.status}`);
        return page === 1 ? null : all;
      }
      const batch = (await this.safeJson(res)) as Location[] | null;
      if (!Array.isArray(batch) || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < 100) break;
    }
    return all;
  }

  /** Sum only the open (end_at = null) sessions from now. */
  private sumOpenSessions(locations: Location[]): number {
    const now = Date.now();
    let seconds = 0;
    for (const loc of locations) {
      if (loc.end_at !== null) continue;
      const begin = new Date(loc.begin_at).getTime();
      if (now > begin) seconds += (now - begin) / 1000;
    }
    return seconds / 3600;
  }

  private monthRange(): { begin: string; end: string } {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
    const fmt = (d: Date) => `${d.toISOString().slice(0, 19)}Z`;
    return { begin: fmt(start), end: fmt(end) };
  }

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
      const data = (await res.json()) as { access_token: string; expires_in: number };
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

  private throttleMs(): number {
    const seconds = Number(
      this.config.get<string>('LOGTIME_SYNC_THROTTLE_SECONDS', String(DEFAULT_SYNC_THROTTLE_SECONDS)),
    );
    return (Number.isFinite(seconds) ? seconds : DEFAULT_SYNC_THROTTLE_SECONDS) * 1000;
  }

  /**
   * Parse a 42 API response body, treating a non-JSON body (proxy error page,
   * truncated response) as a missed sync rather than letting the rejection
   * bubble into the calling request (resyncCoins runs inside GET /users/me).
   */
  private async safeJson(res: Response): Promise<unknown> {
    try {
      return (await res.json()) as unknown;
    } catch (err) {
      this.logger.warn(`42 API returned a non-JSON body: ${String(err)}`);
      return null;
    }
  }

  private async timedFetch(url: string, token: string): Promise<Response | null> {
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
