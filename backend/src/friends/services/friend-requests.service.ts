import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import type { PrismaService } from "@/prisma/prisma.service";
import { FriendshipStatus } from "@prisma/client";
import { ChatGateway } from "@/chat/gateways/chat.gateway";

@Injectable()
export class FriendRequestsService {
  public constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  public async sendFriendRequest(userId: number, targetUsername: string): Promise<unknown> {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new NotFoundException(`User "${targetUsername}" not found`);
    }

    if (targetUser.id === userId) {
      throw new BadRequestException("You cannot add yourself as a friend");
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { receiverId: targetUser.id, senderId: userId },
          { receiverId: userId, senderId: targetUser.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException("You are already friends with this user");
      }

      if (existing.status === FriendshipStatus.PENDING) {
        if (existing.senderId === userId) {
          throw new BadRequestException("Friend request already sent");
        } else {
          return this.acceptFriendRequest(userId, existing.id);
        }
      }
    }

    const request = await this.prisma.friendship.create({
      data: {
        receiverId: targetUser.id,
        senderId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        receiver: {
          select: { campus: true, id: true, username: true },
        },
        sender: {
          select: { campus: true, id: true, username: true },
        },
      },
    });

    this.chatGateway.emitToUser(targetUser.id, "friend:request", {
      campus: request.sender.campus,
      createdAt: request.createdAt,
      id: request.sender.id,
      requestId: request.id,
      username: request.sender.username,
    });

    return request;
  }

  public async acceptFriendRequest(userId: number, requestId: number): Promise<unknown> {
    const friendship = await this.prisma.friendship.findUnique({
      include: {
        receiver: true,
        sender: true,
      },
      where: { id: requestId },
    });

    if (!friendship) {
      throw new NotFoundException("Friend request not found");
    }

    if (friendship.receiverId !== userId) {
      throw new BadRequestException("You can only accept requests sent to you");
    }

    if (friendship.status === FriendshipStatus.ACCEPTED) {
      throw new BadRequestException("Friend request already accepted");
    }

    const updated = await this.prisma.friendship.update({
      data: { status: FriendshipStatus.ACCEPTED },
      include: {
        receiver: {
          select: { campus: true, id: true, username: true },
        },
        sender: {
          select: { campus: true, id: true, username: true },
        },
      },
      where: { id: requestId },
    });

    this.chatGateway.emitToUser(friendship.senderId, "friend:accepted", {
      campus: updated.receiver.campus,
      createdAt: updated.createdAt,
      friendshipId: updated.id,
      id: updated.receiver.id,
      username: updated.receiver.username,
    });

    this.chatGateway.emitToUser(friendship.receiverId, "friend:accepted", {
      campus: updated.sender.campus,
      createdAt: updated.createdAt,
      friendshipId: updated.id,
      id: updated.sender.id,
      username: updated.sender.username,
    });

    return updated;
  }

  public async rejectFriendRequest(userId: number, requestId: number): Promise<unknown> {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: requestId },
    });

    if (!friendship) {
      throw new NotFoundException("Friend request not found");
    }

    if (friendship.senderId !== userId && friendship.receiverId !== userId) {
      throw new BadRequestException("You are not authorized to decline this request");
    }

    const otherUserId =
      friendship.senderId === userId ? friendship.receiverId : friendship.senderId;

    await this.prisma.friendship.delete({
      where: { id: requestId },
    });

    this.chatGateway.emitToUser(otherUserId, "friend:rejected", {
      requestId: friendship.id,
    });

    return { message: "Friend request declined/cancelled successfully" };
  }

  public async getPendingRequests(userId: number): Promise<unknown> {
    const pending = await this.prisma.friendship.findMany({
      include: {
        receiver: {
          select: { campus: true, id: true, username: true },
        },
        sender: {
          select: { campus: true, id: true, username: true },
        },
      },
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: FriendshipStatus.PENDING,
      },
    });

    const incoming = [];
    const outgoing = [];

    for (const f of pending) {
      if (f.receiverId === userId) {
        incoming.push({
          campus: f.sender.campus,
          createdAt: f.createdAt,
          id: f.sender.id,
          requestId: f.id,
          username: f.sender.username,
        });
      } else {
        outgoing.push({
          campus: f.receiver.campus,
          createdAt: f.createdAt,
          id: f.receiver.id,
          requestId: f.id,
          username: f.receiver.username,
        });
      }
    }

    return { incoming, outgoing };
  }
}
