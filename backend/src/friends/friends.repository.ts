import { ForbiddenException, Injectable } from '@nestjs/common';
import { Friendship, FriendshipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Shared low-level access to the friendship link between two users. */
@Injectable()
export class FriendsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The friendship row between two users, in either direction. */
  findBetween(a: string, b: string): Promise<Friendship | null> {
    return this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      },
    });
  }

  /** Throws unless the two users are accepted friends. */
  async ensureFriends(a: string, b: string): Promise<void> {
    const friendship = await this.findBetween(a, b);
    if (!friendship || friendship.status !== FriendshipStatus.ACCEPTED) {
      throw new ForbiddenException('You are not friends with this user');
    }
  }
}
