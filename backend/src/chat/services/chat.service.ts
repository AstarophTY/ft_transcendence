import { Injectable } from "@nestjs/common";
import type { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ChatService {
  public constructor(private readonly prisma: PrismaService) {}

  public async saveMessage(
    senderId: number,
    receiverId: number,
    content: string,
  ): Promise<unknown> {
    return this.prisma.message.create({
      data: {
        content,
        receiverId,
        senderId,
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
  }

  public async getMessageHistory(
    userId: number,
    friendId: number,
    limit = 100,
    skip = 0,
  ): Promise<unknown> {
    return this.prisma.message.findMany({
      include: {
        receiver: {
          select: { id: true, username: true },
        },
        sender: {
          select: { id: true, username: true },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      skip,
      take: limit,
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
    });
  }

  public async getConversations(userId: number): Promise<unknown> {
    const messages = await this.prisma.message.findMany({
      include: {
        receiver: {
          select: { campus: true, id: true, username: true },
        },
        sender: {
          select: { campus: true, id: true, username: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    interface Conversation {
      user: { id: number; username: string; campus: string | null };
      lastMessage: {
        id: number;
        content: string;
        createdAt: Date;
        senderId: number;
      };
    }

    const conversationsMap = new Map<number, Conversation>();

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            id: msg.id,
            senderId: msg.senderId,
          },
          user: otherUser,
        });
      }
    }

    return [...conversationsMap.values()];
  }

  public async saveGlobalMessage(senderId: number, content: string): Promise<unknown> {
    return this.prisma.globalMessage.create({
      data: {
        content,
        senderId,
      },
      include: {
        sender: {
          select: { campus: true, id: true, username: true },
        },
      },
    });
  }

  public async getGlobalMessageHistory(limit = 100, skip = 0): Promise<unknown> {
    return this.prisma.globalMessage.findMany({
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      skip,
      take: limit,
    });
  }
}
