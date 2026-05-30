import { Prisma } from '@prisma/client';
import { PUBLIC_USER_SELECT } from '../users/users.select';

/** A friendship row with both users resolved to their public profile. */
export const FRIENDSHIP_WITH_USERS = {
  include: {
    requester: { select: PUBLIC_USER_SELECT },
    addressee: { select: PUBLIC_USER_SELECT },
  },
} satisfies Prisma.FriendshipDefaultArgs;

export type FriendshipWithUsers = Prisma.FriendshipGetPayload<
  typeof FRIENDSHIP_WITH_USERS
>;
