import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Friendship, FriendshipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FRIENDSHIP_WITH_USERS, FriendshipWithUsers } from './friends.select';
import { FriendsRepository } from './friends.repository';

/** Friend-request lifecycle: send, accept, decline and list pending ones. */
@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: FriendsRepository,
  ) {}

  async send(userId: string, username: string): Promise<Friendship> {
    const target = await this.prisma.user.findUnique({ where: { username } });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === userId) {
      throw new BadRequestException('You cannot add yourself');
    }

    const existing = await this.repo.findBetween(userId, target.id);
    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('You are already friends');
      }
      // The other user already sent us a request: accept it instead.
      if (existing.addresseeId === userId) return this.accept(userId, existing.id);
      throw new ConflictException('Friend request already sent');
    }

    return this.prisma.friendship.create({
      data: { requesterId: userId, addresseeId: target.id },
    });
  }

  async accept(userId: string, friendshipId: string): Promise<Friendship> {
    const request = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!request || request.addresseeId !== userId) {
      throw new NotFoundException('Friend request not found');
    }
    if (request.status === FriendshipStatus.ACCEPTED) return request;

    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatus.ACCEPTED },
    });
  }

  async decline(userId: string, friendshipId: string): Promise<void> {
    const request = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (
      !request ||
      (request.addresseeId !== userId && request.requesterId !== userId) ||
      request.status !== FriendshipStatus.PENDING
    ) {
      throw new NotFoundException('Friend request not found');
    }
    await this.prisma.friendship.delete({ where: { id: friendshipId } });
  }

  listIncoming(userId: string): Promise<FriendshipWithUsers[]> {
    return this.prisma.friendship.findMany({
      where: { addresseeId: userId, status: FriendshipStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      ...FRIENDSHIP_WITH_USERS,
    });
  }

  listOutgoing(userId: string): Promise<FriendshipWithUsers[]> {
    return this.prisma.friendship.findMany({
      where: { requesterId: userId, status: FriendshipStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      ...FRIENDSHIP_WITH_USERS,
    });
  }
}
