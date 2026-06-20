import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(senderId: number, receiverId: number, content: string) {
    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
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
  }

  async getMessageHistory(userId: number, friendId: number, limit = 100, skip = 0) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
      skip: skip,
      include: {
        sender: {
          select: { id: true, username: true },
        },
        receiver: {
          select: { id: true, username: true },
        },
      },
    });
  }

  async getConversations(userId: number) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: 'desc',
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

    const conversationsMap = new Map<number, any>();

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            senderId: msg.senderId,
          },
        });
      }
    }

    return Array.from(conversationsMap.values());
  }

  async saveGlobalMessage(senderId: number, content: string) {
    return this.prisma.globalMessage.create({
      data: {
        senderId,
        content,
      },
      include: {
        sender: {
          select: { id: true, username: true, campus: true },
        },
      },
    });
  }

  async getGlobalMessageHistory(limit = 100, skip = 0) {
    return this.prisma.globalMessage.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
      skip: skip,
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
    });
  }
}
