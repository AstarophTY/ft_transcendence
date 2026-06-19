import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { FriendshipStatus } from '@prisma/client';
import { ChatGateway } from '@/chat/gateways/chat.gateway';

@Injectable()
export class FriendRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async sendFriendRequest(userId: number, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new NotFoundException(`User "${targetUsername}" not found`);
    }

    if (targetUser.id === userId) {
      throw new BadRequestException('You cannot add yourself as a friend');
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException('You are already friends with this user');
      }

      if (existing.status === FriendshipStatus.PENDING) {
        if (existing.senderId === userId) {
          throw new BadRequestException('Friend request already sent');
        } else {
          return this.acceptFriendRequest(userId, existing.id);
        }
      }
    }

    const request = await this.prisma.friendship.create({
      data: {
        senderId: userId,
        receiverId: targetUser.id,
        status: FriendshipStatus.PENDING,
      },
      include: {
        sender: {
          select: { id: true, username: true, campus: true },
        },
        receiver: {
          select: { id: true, username: true, campus: true },
        },
      },
    });

    this.chatGateway.emitToUser(targetUser.id, 'friend:request', {
      requestId: request.id,
      id: request.sender.id,
      username: request.sender.username,
      campus: request.sender.campus,
      createdAt: request.createdAt,
    });

    return request;
  }

  async acceptFriendRequest(userId: number, requestId: number) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendship.receiverId !== userId) {
      throw new BadRequestException('You can only accept requests sent to you');
    }

    if (friendship.status === FriendshipStatus.ACCEPTED) {
      throw new BadRequestException('Friend request already accepted');
    }

    const updated = await this.prisma.friendship.update({
      where: { id: requestId },
      data: { status: FriendshipStatus.ACCEPTED },
      include: {
        sender: {
          select: { id: true, username: true, campus: true },
        },
        receiver: {
          select: { id: true, username: true, campus: true },
        },
      },
    });

    this.chatGateway.emitToUser(friendship.senderId, 'friend:accepted', {
      friendshipId: updated.id,
      id: updated.receiver.id,
      username: updated.receiver.username,
      campus: updated.receiver.campus,
      createdAt: updated.createdAt,
    });

    this.chatGateway.emitToUser(friendship.receiverId, 'friend:accepted', {
      friendshipId: updated.id,
      id: updated.sender.id,
      username: updated.sender.username,
      campus: updated.sender.campus,
      createdAt: updated.createdAt,
    });

    return updated;
  }

  async rejectFriendRequest(userId: number, requestId: number) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: requestId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendship.senderId !== userId && friendship.receiverId !== userId) {
      throw new BadRequestException('You are not authorized to decline this request');
    }

    const otherUserId = friendship.senderId === userId ? friendship.receiverId : friendship.senderId;

    await this.prisma.friendship.delete({
      where: { id: requestId },
    });

    this.chatGateway.emitToUser(otherUserId, 'friend:rejected', {
      requestId: friendship.id,
    });

    return { message: 'Friend request declined/cancelled successfully' };
  }

  async getPendingRequests(userId: number) {
    const pending = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.PENDING,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, username: true, campus: true },
        },
        receiver: {
          select: { id: true, username: true, campus: true },
        },
      },
    });

    const incoming = [];
    const outgoing = [];

    for (const f of pending) {
      if (f.receiverId === userId) {
        incoming.push({
          requestId: f.id,
          id: f.sender.id,
          username: f.sender.username,
          campus: f.sender.campus,
          createdAt: f.createdAt,
        });
      } else {
        outgoing.push({
          requestId: f.id,
          id: f.receiver.id,
          username: f.receiver.username,
          campus: f.receiver.campus,
          createdAt: f.createdAt,
        });
      }
    }

    return { incoming, outgoing };
  }
}
