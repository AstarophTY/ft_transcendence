import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Friendship, FriendshipStatus, Message, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_USER_SELECT, PublicUser } from '../users/users.select';

const FRIENDSHIP_WITH_USERS = {
  include: {
    requester: { select: PUBLIC_USER_SELECT },
    addressee: { select: PUBLIC_USER_SELECT },
  },
} satisfies Prisma.FriendshipDefaultArgs;

type FriendshipWithUsers = Prisma.FriendshipGetPayload<
  typeof FRIENDSHIP_WITH_USERS
>;

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendRequest(userId: string, username: string): Promise<Friendship> {
    const target = await this.prisma.user.findUnique({ where: { username } });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === userId) {
      throw new BadRequestException('You cannot add yourself');
    }

    const existing = await this.findBetween(userId, target.id);
    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('You are already friends');
      }
      if (existing.addresseeId === userId) {
        return this.accept(userId, existing.id);
      }
      throw new ConflictException('Friend request already sent');
    }

    return this.prisma.friendship.create({
      data: { requesterId: userId, addresseeId: target.id },
    });
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

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const friendship = await this.findBetween(userId, friendId);
    if (!friendship || friendship.status !== FriendshipStatus.ACCEPTED) {
      throw new NotFoundException('Friendship not found');
    }
    await this.prisma.friendship.delete({ where: { id: friendship.id } });
  }

  async getFriendProfile(
    userId: string,
    friendId: string,
  ): Promise<PublicUser> {
    await this.ensureFriends(userId, friendId);
    const profile = await this.prisma.user.findUnique({
      where: { id: friendId },
      select: PUBLIC_USER_SELECT,
    });
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  async sendMessage(
    userId: string,
    friendId: string,
    content: string,
  ): Promise<Message> {
    await this.ensureFriends(userId, friendId);
    return this.prisma.message.create({
      data: { senderId: userId, receiverId: friendId, content },
    });
  }

  async getConversation(userId: string, friendId: string): Promise<Message[]> {
    await this.ensureFriends(userId, friendId);
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private findBetween(a: string, b: string): Promise<Friendship | null> {
    return this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      },
    });
  }

  private async ensureFriends(a: string, b: string): Promise<void> {
    const friendship = await this.findBetween(a, b);
    if (!friendship || friendship.status !== FriendshipStatus.ACCEPTED) {
      throw new ForbiddenException('You are not friends with this user');
    }
  }
}
