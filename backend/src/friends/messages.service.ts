import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FriendsRepository } from './friends.repository';

/** Direct messages between friends. */
@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: FriendsRepository,
  ) {}

  async send(
    userId: string,
    friendId: string,
    content: string,
  ): Promise<Message> {
    await this.repo.ensureFriends(userId, friendId);
    return this.prisma.message.create({
      data: { senderId: userId, receiverId: friendId, content },
    });
  }

  /** The conversation between the current user and a friend, oldest first. */
  async getConversation(userId: string, friendId: string): Promise<Message[]> {
    await this.repo.ensureFriends(userId, friendId);
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
}
