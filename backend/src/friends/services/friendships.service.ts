import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { FriendshipStatus } from '@prisma/client';
import { ChatGateway } from '@/chat/gateways/chat.gateway';

@Injectable()
export class FriendshipsService {
  constructor(
    public readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async getFriends(userId: number) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
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
    return friendships.map((f) => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      return {
        friendshipId: f.id,
        id: friend.id,
        username: friend.username,
        campus: friend.campus,
        createdAt: f.createdAt,
      };
    });
  }

  async removeFriend(userId: number, friendId: number) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });
    this.chatGateway.emitToUser(userId, 'friend:removed', { friendId });
    this.chatGateway.emitToUser(friendId, 'friend:removed', { friendId: userId });

    return { message: 'Friend removed successfully' };
  }
}
