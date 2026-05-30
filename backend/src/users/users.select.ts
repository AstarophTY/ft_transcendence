import { Prisma } from '@prisma/client';

export const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  avatar: true,
  role: true,
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
  campus: true,
  language: true,
  theme: true,
  status: true,
  statusMessage: true,
  usernameChangedAt: true,
  fortyTwoLogin: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type SelfUser = Prisma.UserGetPayload<{
  select: typeof SELF_USER_SELECT;
}>;
