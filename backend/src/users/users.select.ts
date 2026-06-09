import { Prisma } from '@prisma/client';

export const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  avatar: true,
  role: true,
  displayName: true,
  bio: true,
  status: true,
  statusMessage: true,
  campus: {
    select: {
      label: true,
    },
  },
  coins: true,
  logtimeHours: true,
  monthLogtimeHours: true,
  skinColor: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof PUBLIC_USER_SELECT;
}>;

/**
 * Everything the owner may see about their own account — email and campus
 * included, but never the password hash. Add a field here to expose it to the
 * account settings screen.
 */
export const SELF_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  avatar: true,
  role: true,
  displayName: true,
  bio: true,
  campus: {
    select: {
      label: true,
    },
  },
  coins: true,
  coinsSpent: true,
  logtimeHours: true,
  monthLogtimeHours: true,
  language: true,
  theme: true,
  skinColor: true,
  status: true,
  statusMessage: true,
  usernameChangedAt: true,
  fortyTwoLogin: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type SelfUser = Prisma.UserGetPayload<{
  select: typeof SELF_USER_SELECT;
}>;

/**
 * Self profile enriched with the coin rate and the site logtime (hours since
 * the account was created).
 */
export type SelfProfile = SelfUser & {
  coinsPerHour: number;
  siteLogtimeHours: number;
};

/** Fields an admin sees for each account in the admin panel. */
export const ADMIN_USER_SELECT = {
  id: true,
  username: true,
  email: true,
  avatar: true,
  role: true,
  displayName: true,
  bio: true,
  campus: {
    select: {
      label: true,
    },
  },
  coins: true,
  logtimeHours: true,
  monthLogtimeHours: true,
  status: true,
  statusMessage: true,
  fortyTwoLogin: true,
  isVerified: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type AdminUser = Prisma.UserGetPayload<{
  select: typeof ADMIN_USER_SELECT;
}>;
