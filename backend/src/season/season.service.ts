import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Season } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorldGateway } from '../world/world.gateway';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';

/**
 * Phases are derived from a season's timestamps rather than stored, so this
 * mirrors the (unused) Prisma `SeasonPhase` enum as a plain TS enum. The string
 * values match the DB type.
 */
export enum SeasonPhase {
  UPCOMING = 'UPCOMING',
  BUILD = 'BUILD',
  DELAY = 'DELAY',
  VOTE = 'VOTE',
  ENDED = 'ENDED',
}

/** Personal-island footprint and campus claim-zone size: 4 chunks of 16 blocks. */
const CHUNK_SIZE = 16;
const CLAIM_CHUNKS = 4;
const CLAIM_BLOCKS = CHUNK_SIZE * CLAIM_CHUNKS; // 64
/** World height, mirroring the gateway/world-scene bounds. */
const MAP_HEIGHT = 64;
/**
 * Campus worlds always render as a fixed 32×32-chunk map (see the world scene's
 * MAP_SIZE_BLOCKS), regardless of the terrain profile's chunk counts. The
 * capital is the central 4×4 claim zone, so its block origin must be derived
 * from this fixed size — using the profile's smaller widthInChunks would drop
 * the island in a corner instead of the protected centre.
 */
const MAP_CHUNKS_PER_SIDE = 32;
const CAPITAL_ORIGIN = (Math.floor(MAP_CHUNKS_PER_SIDE / 2) - 2) * CHUNK_SIZE; // 224
/**
 * The capital claim zone coincides with IslandMap's flat central zone, whose
 * ground is levelled to this height regardless of the terrain's baseHeight
 * (see IslandMap.getHeightAt's flat-center constraint). Winning islands must be
 * dropped onto *this* surface, not the profile baseHeight, or they float above
 * (resp. sink into) the flat capital ground. Keep in sync with IslandMap.
 */
const FLAT_CENTER_HEIGHT = 12;
/**
 * Personal islands are generated client-side on a flat plains floor whose top
 * (grass) sits at this fixed height (see WorldScene.generateLocalMap, where the
 * private branch forces `height = 5`). The floor itself is never persisted —
 * only the blocks the user places are. Aligning this surface to the capital's
 * flat grass surface lets the capital's own generated floor stand in for the
 * island's, so a winning island lands grounded instead of floating. Keep in
 * sync with WorldScene. */
const PRIVATE_GROUND_HEIGHT = 5;

/**
 * The single global building+voting season. Phases are derived from the stored
 * timestamps; admins "fast-forward" by pushing those timestamps to now(). When
 * a season ends, each campus's most-voted personal island is copied into that
 * campus world's central claim zone.
 */
@Injectable()
export class SeasonService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WorldGateway))
    private readonly worldGateway: WorldGateway,
  ) {}

  /** Derive the current phase of a season from the clock. */
  static phaseOf(season: Season, now = new Date()): SeasonPhase {
    if (now < season.buildStartsAt) return SeasonPhase.UPCOMING;
    if (now < season.buildEndsAt) return SeasonPhase.BUILD;
    if (now < season.voteStartsAt) return SeasonPhase.DELAY;
    if (now < season.voteEndsAt) return SeasonPhase.VOTE;
    return SeasonPhase.ENDED;
  }

  /** The currently-running season: the most recently activated live season. */
  private runningSeason(): Promise<Season | null> {
    return this.prisma.season.findFirst({
      where: { isActive: true, startedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
    });
  }

  /** A scheduled next season that has not been activated yet, if any. */
  private queuedSeason(): Promise<Season | null> {
    return this.prisma.season.findFirst({
      where: { isActive: true, startedAt: null },
      orderBy: { buildStartsAt: 'asc' },
    });
  }

  /**
   * The season that currently governs the world. A queued season is activated
   * lazily once its build phase begins (resetting the world from the outgoing
   * season's winners). Until anything has started, an upcoming queued season
   * governs so it can show as UPCOMING. Returns null when nothing is configured.
   */
  private async resolveGoverning(): Promise<Season | null> {
    const queued = await this.queuedSeason();
    if (queued && queued.buildStartsAt <= new Date()) {
      await this.activate(queued);
      return this.runningSeason();
    }
    const running = await this.runningSeason();
    return running ?? queued;
  }

  /**
   * Promote a queued season to the running one: reset the universe from the
   * outgoing season's winners, archive that season, and stamp `startedAt`. The
   * claim is atomic so a single rollover runs even under concurrent callers.
   */
  private async activate(queued: Season): Promise<void> {
    // Snapshot the outgoing running season before we stamp the queued one
    // (otherwise it would match `runningSeason()` itself).
    const previous = await this.runningSeason();

    const claimed = await this.prisma.season.updateMany({
      where: { id: queued.id, startedAt: null },
      data: { startedAt: new Date() },
    });
    if (claimed.count === 0) return; // already activated by a concurrent call

    try {
      await this.rollOverWorlds(previous);
      if (previous) {
        await this.prisma.season.update({
          where: { id: previous.id },
          data: { isActive: false },
        });
      }
      // Connected clients still hold the old blocks/seed; tell them to reload.
      this.worldGateway.broadcastWorldReset();
    } catch (err) {
      // Release the claim so activation retries on the next tick.
      await this.prisma.season.update({
        where: { id: queued.id },
        data: { startedAt: null },
      });
      throw err;
    }
  }

  /**
   * The governing season with its derived phase, plus any queued next season.
   * Self-heals: finalizes a running season whose vote has elapsed but was never
   * closed, and activates a queued season whose build phase has begun.
   */
  async getCurrent(): Promise<{
    season: Season | null;
    phase: SeasonPhase | null;
    next: Season | null;
  }> {
    let season = await this.resolveGoverning();
    if (!season) return { season: null, phase: null, next: null };

    if (SeasonService.phaseOf(season) === SeasonPhase.ENDED && !season.finalizedAt) {
      season = await this.finalize(season);
    }
    // A queued season only counts as "next" when it isn't itself the governing one.
    const queued = await this.queuedSeason();
    const next = queued && queued.id !== season.id ? queued : null;
    return { season, phase: SeasonService.phaseOf(season), next };
  }

  /** The current phase, used by the world gateway to gate building. */
  async currentPhase(): Promise<SeasonPhase | null> {
    const season = await this.resolveGoverning();
    return season ? SeasonService.phaseOf(season) : null;
  }

  /**
   * Every season (past, running and queued), newest first, with its derived
   * phase — for the admin overview list.
   */
  async listAll(): Promise<{ season: Season; phase: SeasonPhase }[]> {
    const seasons = await this.prisma.season.findMany({
      orderBy: { buildStartsAt: 'desc' },
    });
    return seasons.map((season) => ({
      season,
      phase: SeasonService.phaseOf(season),
    }));
  }

  // --- admin lifecycle -------------------------------------------------------

  /**
   * Open or schedule a season.
   *
   * A season whose build starts now (or has no running season to wait for) takes
   * over immediately, resetting the universe: every island is wiped, the campus
   * planets get a fresh seed, and each capital is rebuilt from the outgoing
   * season's winner.
   *
   * A season scheduled for later is merely *queued*: the running season keeps
   * going and building stays open. The world reset + takeover fire automatically
   * once the queued season's build phase begins (see {@link resolveGoverning}).
   */
  async create(dto: CreateSeasonDto): Promise<Season> {
    const buildStartsAt = new Date(dto.buildStartsAt);
    const buildEndsAt = new Date(dto.buildEndsAt);
    if (buildEndsAt <= buildStartsAt) {
      throw new BadRequestException('Build end must be after build start');
    }
    const voteStartsAt = new Date(buildEndsAt.getTime() + dto.voteDelayMinutes * 60_000);
    const voteEndsAt = new Date(voteStartsAt.getTime() + dto.voteDurationMinutes * 60_000);
    const data = { title: dto.title, buildStartsAt, buildEndsAt, voteStartsAt, voteEndsAt };

    const now = new Date();
    const running = await this.runningSeason();

    // Schedule for later: queue it without disrupting the running season. The
    // world reset is deferred to its build start (see resolveGoverning).
    if (buildStartsAt > now) {
      if (
        running &&
        SeasonService.phaseOf(running) !== SeasonPhase.ENDED &&
        buildStartsAt < running.voteEndsAt
      ) {
        throw new BadRequestException(
          "The next season must start after the current season's vote ends",
        );
      }
      // Replace any previously queued season — only one may be scheduled.
      await this.prisma.season.updateMany({
        where: { isActive: true, startedAt: null },
        data: { isActive: false },
      });
      // Left queued: startedAt stays null until its build phase begins.
      return this.prisma.season.create({ data });
    }

    // Immediate takeover: reset the world from the outgoing season's winners.
    await this.prisma.season.updateMany({
      where: { isActive: true, startedAt: null },
      data: { isActive: false },
    });
    await this.rollOverWorlds(running);
    if (running) {
      await this.prisma.season.update({
        where: { id: running.id },
        data: { isActive: false },
      });
    }
    const season = await this.prisma.season.create({
      data: { ...data, startedAt: now },
    });

    // Connected clients still hold the old blocks/seed in memory; tell them to
    // reload so the reset and the new campus capitals show up immediately.
    this.worldGateway.broadcastWorldReset();

    return season;
  }

  /**
   * Delete a season along with its ballots and results (cascaded). World blocks
   * are independent of seasons, so they are left untouched. Deleting the running
   * season simply leaves the world read-only until the next one starts.
   */
  async remove(id: string): Promise<void> {
    const season = await this.prisma.season.findUnique({ where: { id } });
    if (!season) throw new NotFoundException('Season not found');
    await this.prisma.season.delete({ where: { id } });
  }

  /** Edit the running season's window/title. */
  async update(dto: UpdateSeasonDto): Promise<Season> {
    const season = await this.requireActive();

    const buildStartsAt = dto.buildStartsAt ? new Date(dto.buildStartsAt) : season.buildStartsAt;
    const buildEndsAt = dto.buildEndsAt ? new Date(dto.buildEndsAt) : season.buildEndsAt;
    if (buildEndsAt <= buildStartsAt) {
      throw new BadRequestException('Build end must be after build start');
    }

    // Recompute the vote window when timing inputs change.
    const delayMs =
      dto.voteDelayMinutes !== undefined
        ? dto.voteDelayMinutes * 60_000
        : season.voteStartsAt.getTime() - season.buildEndsAt.getTime();
    const durationMs =
      dto.voteDurationMinutes !== undefined
        ? dto.voteDurationMinutes * 60_000
        : season.voteEndsAt.getTime() - season.voteStartsAt.getTime();
    const voteStartsAt = new Date(buildEndsAt.getTime() + delayMs);
    const voteEndsAt = new Date(voteStartsAt.getTime() + durationMs);

    return this.prisma.season.update({
      where: { id: season.id },
      data: {
        title: dto.title ?? season.title,
        buildStartsAt,
        buildEndsAt,
        voteStartsAt,
        voteEndsAt,
      },
    });
  }

  /** Fast-forward: end building now, keeping the configured delay + duration. */
  async endBuildNow(): Promise<Season> {
    const season = await this.requireActive();
    const now = new Date();
    const delayMs = season.voteStartsAt.getTime() - season.buildEndsAt.getTime();
    const durationMs = season.voteEndsAt.getTime() - season.voteStartsAt.getTime();
    const voteStartsAt = new Date(now.getTime() + Math.max(0, delayMs));
    const voteEndsAt = new Date(voteStartsAt.getTime() + durationMs);
    return this.prisma.season.update({
      where: { id: season.id },
      data: { buildEndsAt: now, voteStartsAt, voteEndsAt },
    });
  }

  /** Fast-forward: skip the delay and open the vote now, keeping its duration. */
  async openVoteNow(): Promise<Season> {
    const season = await this.requireActive();
    const now = new Date();
    const durationMs = season.voteEndsAt.getTime() - season.voteStartsAt.getTime();
    return this.prisma.season.update({
      where: { id: season.id },
      data: {
        buildEndsAt: min(season.buildEndsAt, now),
        voteStartsAt: now,
        voteEndsAt: new Date(now.getTime() + durationMs),
      },
    });
  }

  /** Fast-forward: close the vote now (phase becomes ENDED). */
  async closeVoteNow(): Promise<Season> {
    const season = await this.requireActive();
    const now = new Date();
    return this.prisma.season.update({
      where: { id: season.id },
      data: {
        buildEndsAt: min(season.buildEndsAt, now),
        voteStartsAt: min(season.voteStartsAt, now),
        voteEndsAt: now,
      },
    });
  }

  /** Close the vote (if needed) and compute results + copy winning islands. */
  async finalizeNow(): Promise<Season> {
    let season = await this.requireActive();
    if (SeasonService.phaseOf(season) !== SeasonPhase.ENDED) {
      season = await this.closeVoteNow();
    }
    return this.finalize(season);
  }

  // --- voting ----------------------------------------------------------------

  /**
   * Every campus with its members' personal islands and vote counts. Members
   * vote for an island in their own campus; campus-less accounts instead vote
   * for a whole campus (the `campusVotes` count drives the end-of-season
   * podium). Anyone may browse/visit any island or campus.
   */
  async getBallot(userId: string) {
    const { season, phase, next } = await this.getCurrent();

    const voter = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { campusId: true },
    });
    const hasCampus = Boolean(voter?.campusId);

    const campuses = await this.prisma.campus.findMany({
      orderBy: { label: 'asc' },
      include: {
        users: {
          where: { world: { isNot: null } },
          select: { id: true, username: true, avatar: true },
          orderBy: { username: 'asc' },
        },
      },
    });

    const counts = new Map<string, number>();
    const campusCounts = new Map<string, number>();
    let myVoteCandidateId: string | null = null;
    let myCampusVoteId: string | null = null;
    if (season) {
      const grouped = await this.prisma.seasonVote.groupBy({
        by: ['candidateId'],
        where: { seasonId: season.id },
        _count: { candidateId: true },
      });
      for (const g of grouped) counts.set(g.candidateId, g._count.candidateId);

      const groupedCampus = await this.prisma.seasonCampusVote.groupBy({
        by: ['campusId'],
        where: { seasonId: season.id },
        _count: { campusId: true },
      });
      for (const g of groupedCampus) campusCounts.set(g.campusId, g._count.campusId);

      const mine = await this.prisma.seasonVote.findUnique({
        where: { seasonId_voterId: { seasonId: season.id, voterId: userId } },
        select: { candidateId: true },
      });
      myVoteCandidateId = mine?.candidateId ?? null;

      const mineCampus = await this.prisma.seasonCampusVote.findUnique({
        where: { seasonId_voterId: { seasonId: season.id, voterId: userId } },
        select: { campusId: true },
      });
      myCampusVoteId = mineCampus?.campusId ?? null;
    }

    const campusGroups = campuses.map((campus) => ({
      campusId: campus.id,
      label: campus.label,
      isOwn: campus.id === voter?.campusId,
      campusVotes: campusCounts.get(campus.id) ?? 0,
      candidates: campus.users
        .map((u) => ({
          userId: u.id,
          username: u.username,
          avatar: u.avatar,
          votes: counts.get(u.id) ?? 0,
        }))
        .sort((a, b) => b.votes - a.votes || a.username.localeCompare(b.username)),
    }));

    return {
      season,
      phase,
      next,
      myVoteCandidateId,
      myCampusVoteId,
      // Members vote for an island in their campus; campus-less accounts vote for
      // a whole campus instead.
      canVote: Boolean(season) && phase === SeasonPhase.VOTE && hasCampus,
      canVoteCampus: Boolean(season) && phase === SeasonPhase.VOTE && !hasCampus,
      campuses: campusGroups,
      ...(await this.previousWinners()),
    };
  }

  /**
   * The winning island per campus from the most recent finalized season. These
   * islands now live in each campus capital, so the dialog can list them and let
   * players visit the campus to see them.
   */
  private async previousWinners(): Promise<{
    previousSeasonTitle: string | null;
    previousWinners: {
      campusId: string;
      campusLabel: string;
      username: string | null;
      avatar: string | null;
      votes: number;
    }[];
  }> {
    const last = await this.prisma.season.findFirst({
      where: { finalizedAt: { not: null } },
      orderBy: { finalizedAt: 'desc' },
      include: { results: { include: { campus: { select: { label: true } } } } },
    });
    if (!last) return { previousSeasonTitle: null, previousWinners: [] };

    const winnerIds = last.results
      .map((r) => r.winnerUserId)
      .filter((id): id is string => Boolean(id));
    const users = await this.prisma.user.findMany({
      where: { id: { in: winnerIds } },
      select: { id: true, username: true, avatar: true },
    });

    const previousWinners = last.results
      .filter((r) => r.winnerUserId)
      .map((r) => {
        const u = users.find((u) => u.id === r.winnerUserId);
        return {
          campusId: r.campusId,
          campusLabel: r.campus.label,
          username: u?.username ?? null,
          avatar: u?.avatar ?? null,
          votes: r.votes,
        };
      })
      .sort((a, b) => b.votes - a.votes || a.campusLabel.localeCompare(b.campusLabel));

    return { previousSeasonTitle: last.title, previousWinners };
  }

  /** Cast or switch a vote for a campus member's island. */
  async vote(voterId: string, candidateId: string) {
    const season = await this.requireActive();
    if (SeasonService.phaseOf(season) !== SeasonPhase.VOTE) {
      throw new BadRequestException('Voting is not open');
    }
    if (voterId === candidateId) {
      throw new BadRequestException('You cannot vote for your own island');
    }

    const voter = await this.prisma.user.findUnique({
      where: { id: voterId },
      select: { campusId: true },
    });
    if (!voter?.campusId) {
      throw new BadRequestException('You must belong to a campus to vote');
    }

    const candidate = await this.prisma.user.findUnique({
      where: { id: candidateId },
      select: { campusId: true, world: { select: { id: true } } },
    });
    if (!candidate || !candidate.world) {
      throw new NotFoundException('That member has no island to vote for');
    }
    if (candidate.campusId !== voter.campusId) {
      throw new BadRequestException('You can only vote within your own campus');
    }

    return this.prisma.seasonVote.upsert({
      where: { seasonId_voterId: { seasonId: season.id, voterId } },
      create: { seasonId: season.id, campusId: voter.campusId, voterId, candidateId },
      update: { candidateId, campusId: voter.campusId },
    });
  }

  /**
   * Cast or switch a campus-level vote. Reserved for campus-less accounts: a
   * member's voice goes to an island in their own campus, not to a campus.
   */
  async voteCampus(voterId: string, campusId: string) {
    const season = await this.requireActive();
    if (SeasonService.phaseOf(season) !== SeasonPhase.VOTE) {
      throw new BadRequestException('Voting is not open');
    }

    const voter = await this.prisma.user.findUnique({
      where: { id: voterId },
      select: { campusId: true },
    });
    if (voter?.campusId) {
      throw new BadRequestException('Campus members vote for an island, not a campus');
    }

    const campus = await this.prisma.campus.findUnique({
      where: { id: campusId },
      select: { id: true },
    });
    if (!campus) {
      throw new NotFoundException('That campus does not exist');
    }

    return this.prisma.seasonCampusVote.upsert({
      where: { seasonId_voterId: { seasonId: season.id, voterId } },
      create: { seasonId: season.id, voterId, campusId },
      update: { campusId },
    });
  }

  // --- finalization ----------------------------------------------------------

  /**
   * Record the per-campus winners of a season and mark it finalized. This only
   * tallies the results — it deliberately does NOT touch the campus capitals:
   * the winning island is moved to the centre only when the *next* season
   * starts (see rollOverWorlds), not the instant a season ends.
   */
  private async finalize(season: Season): Promise<Season> {
    const best = await this.winnersOf(season);

    for (const [campusId, { candidateId, votes }] of best) {
      await this.prisma.seasonResult.upsert({
        where: { seasonId_campusId: { seasonId: season.id, campusId } },
        create: { seasonId: season.id, campusId, winnerUserId: candidateId, votes },
        update: { winnerUserId: candidateId, votes },
      });
    }

    return this.prisma.season.update({
      where: { id: season.id },
      data: { finalizedAt: new Date() },
    });
  }

  /**
   * Translate a personal island's blocks into a campus world's central capital
   * zone. The island is recentred on the claim-zone origin and shifted so its
   * (flat, fixed-height) ground level lines up with the capital's flat grass
   * surface. The capital zone is levelled to FLAT_CENTER_HEIGHT (not the profile
   * baseHeight), so we align to that.
   */
  private translateToCapital(
    campusWorld: { id: string; baseHeight: number },
    blocks: { x: number; y: number; z: number; block: number; rotation: number }[],
  ): { worldId: string; x: number; y: number; z: number; block: number; rotation: number }[] {
    const claimed = blocks.filter(
      (b) => b.x >= 0 && b.x < CLAIM_BLOCKS && b.z >= 0 && b.z < CLAIM_BLOCKS,
    );
    if (claimed.length === 0) return [];

    // Map the island's coordinate space onto the capital by aligning the
    // island's fixed ground surface (PRIVATE_GROUND_HEIGHT) with the capital's
    // flat grass surface (FLAT_CENTER_HEIGHT). This is a constant shift — *not*
    // a drop based on the lowest placed block. A minY-based drop only works when
    // the user built strictly above ground; the moment they edit the surface or
    // dig below it, the lowest block is no longer the island's floor and the
    // whole build floats above (resp. sinks into) the capital. With a fixed
    // shift, surface edits land on the capital surface and below-grade builds
    // stay buried in the capital's own floor, which renders the island's ground.
    const yOffset = FLAT_CENTER_HEIGHT - PRIVATE_GROUND_HEIGHT;

    return claimed.map((b) => ({
      worldId: campusWorld.id,
      x: b.x + CAPITAL_ORIGIN,
      y: clamp(b.y + yOffset, 0, MAP_HEIGHT - 1),
      z: b.z + CAPITAL_ORIGIN,
      block: b.block,
      rotation: b.rotation,
    }));
  }

  /** Highest-voted island per campus for a season. */
  private async winnersOf(
    season: Season,
  ): Promise<Map<string, { candidateId: string; votes: number }>> {
    const grouped = await this.prisma.seasonVote.groupBy({
      by: ['campusId', 'candidateId'],
      where: { seasonId: season.id },
      _count: { candidateId: true },
    });

    const best = new Map<string, { candidateId: string; votes: number }>();
    for (const g of grouped) {
      const votes = g._count.candidateId;
      const current = best.get(g.campusId);
      if (!current || votes > current.votes) {
        best.set(g.campusId, { candidateId: g.candidateId, votes });
      }
    }
    return best;
  }

  // --- season rollover -------------------------------------------------------

  /**
   * Reset the universe for a new season. This is where the outgoing season's
   * winning island is finally moved to each campus centre — so the middle island
   * only becomes the most-voted one when the *new* season begins, never the
   * instant the previous one ended. The whole campus planet is wiped and
   * reseeded; the central capital claim zone is then rebuilt from the winner (or
   * kept as-is when there is no winner). Personal islands start empty.
   */
  private async rollOverWorlds(previous: Season | null): Promise<void> {
    const campusWorlds = await this.prisma.world.findMany({
      where: { campusId: { not: null } },
    });

    // 1. Settle the outgoing season: record its results and mark it finalized.
    const winners = previous
      ? await this.winnersOf(previous)
      : new Map<string, { candidateId: string; votes: number }>();
    if (previous) {
      for (const [campusId, { candidateId, votes }] of winners) {
        await this.prisma.seasonResult.upsert({
          where: { seasonId_campusId: { seasonId: previous.id, campusId } },
          create: { seasonId: previous.id, campusId, winnerUserId: candidateId, votes },
          update: { winnerUserId: candidateId, votes },
        });
      }
      if (!previous.finalizedAt) {
        await this.prisma.season.update({
          where: { id: previous.id },
          data: { finalizedAt: new Date() },
        });
      }
    }

    // 2. Build each campus capital for the new season: the winning island when a
    //    campus has a winner this season, otherwise keep its current centre.
    const capital: {
      worldId: string;
      x: number;
      y: number;
      z: number;
      block: number;
      rotation: number;
    }[] = [];
    for (const world of campusWorlds) {
      const winner = world.campusId ? winners.get(world.campusId) : undefined;
      if (winner) {
        const island = await this.prisma.world.findUnique({
          where: { userId: winner.candidateId },
          include: {
            blocks: { select: { x: true, y: true, z: true, block: true, rotation: true } },
          },
        });
        if (island) {
          capital.push(...this.translateToCapital(world, island.blocks));
          continue;
        }
      }
      // No winner (or the winner lost their island): keep the current centre.
      const existing = await this.prisma.worldBlock.findMany({
        where: {
          worldId: world.id,
          x: { gte: CAPITAL_ORIGIN, lt: CAPITAL_ORIGIN + CLAIM_BLOCKS },
          z: { gte: CAPITAL_ORIGIN, lt: CAPITAL_ORIGIN + CLAIM_BLOCKS },
        },
        select: { worldId: true, x: true, y: true, z: true, block: true, rotation: true },
      });
      capital.push(...existing);
    }

    // 3. Wipe every world, clear the ballot, reseed the campus planets, then lay
    //    down the new central islands — atomically so the universe is never
    //    half-reset.
    await this.prisma.$transaction([
      this.prisma.worldBlock.deleteMany({}),
      this.prisma.seasonVote.deleteMany({}),
      this.prisma.seasonCampusVote.deleteMany({}),
      ...campusWorlds.map((w) =>
        this.prisma.world.update({
          where: { id: w.id },
          data: { seed: `world-${randomUUID()}` },
        }),
      ),
      ...(capital.length > 0
        ? [this.prisma.worldBlock.createMany({ data: capital, skipDuplicates: true })]
        : []),
    ]);
  }

  private async requireActive(): Promise<Season> {
    const season = await this.resolveGoverning();
    if (!season) throw new NotFoundException('No active season');
    return season;
  }
}

const min = (a: Date, b: Date): Date => (a < b ? a : b);

const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, n));
