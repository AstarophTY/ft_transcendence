/**
 * Coins are earned from the account's site logtime (time since registration)
 * and spent placing paid blocks. The balance is always derived, never stored
 * on its own: `balance = floor(siteLogtimeHours * rate) - coinsSpent`.
 */

const HOUR_MS = 3_600_000;

/** Coins earned so far from the account age. */
export const earnedCoins = (createdAt: Date, rate: number): number =>
  Math.floor(((Date.now() - createdAt.getTime()) / HOUR_MS) * rate);

/** Spendable coin balance (never negative). */
export const coinBalance = (
  createdAt: Date,
  coinsSpent: number,
  rate: number,
): number => Math.max(0, earnedCoins(createdAt, rate) - coinsSpent);
