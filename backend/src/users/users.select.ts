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
