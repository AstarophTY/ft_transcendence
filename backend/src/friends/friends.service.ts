import { Injectable, NotFoundException } from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_USER_SELECT, PublicUser } from '../users/users.select';
import { FRIENDSHIP_WITH_USERS } from './friends.select';
import { FriendsRepository } from './friends.repository';

/** Accepted friendships: listing, removal and public profiles. */
@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: FriendsRepository,
  ) {}

  /** Public profiles of every accepted friend of the current user. */
  async listFriends(userId: string): Promise<PublicUser[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      ...FRIENDSHIP_WITH_USERS,
    });
    return friendships.map((f) =>
      f.requesterId === userId ? f.addressee : f.requester,
    );
  }

  /** Remove an accepted friend (in either direction). */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    const friendship = await this.repo.findBetween(userId, friendId);
    if (!friendship || friendship.status !== FriendshipStatus.ACCEPTED) {
      throw new NotFoundException('Friendship not found');
    }
    await this.prisma.friendship.delete({ where: { id: friendship.id } });
  }

  /**
   * Info about a friend (avatar, username, …) — never the email. Throws
   * unless the two users are actually friends.
   */
  async getFriendProfile(
    userId: string,
    friendId: string,
  ): Promise<PublicUser> {
    await this.repo.ensureFriends(userId, friendId);
    const profile = await this.prisma.user.findUnique({
      where: { id: friendId },
      select: PUBLIC_USER_SELECT,
    });
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }
}
