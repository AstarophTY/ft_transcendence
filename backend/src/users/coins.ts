/**
 * Coins are earned from the account's age — the time elapsed since it was
 * created — at a configurable per-hour rate. A member's earned coins feed their
 * campus build budget; the value is always derived from `createdAt`, never
 * stored, so it ticks up on its own for every account (42 or email alike).
 */
import type { ConfigService } from '@nestjs/config';

const HOUR_MS = 3_600_000;

/** The configured coins-earned-per-hour rate (default 1). */
export const coinRate = (config: ConfigService): number =>
  Number(config.get<string>('COINS_PER_HOUR', '1')) || 1;

/** Coins earned so far from the account age. */
export const earnedCoins = (createdAt: Date, rate: number): number =>
  Math.floor(((Date.now() - createdAt.getTime()) / HOUR_MS) * rate);
