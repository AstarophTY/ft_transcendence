import { Inject, Injectable, NotFoundException, forwardRef } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { FriendshipStatus } from "@prisma/client";
import { ChatGateway } from "@/chat/gateways/chat.gateway";

@Injectable()
export class FriendshipsService {
  public constructor(
    public readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  public async getFriends(userId: number): Promise<
    {
      campus: string | null;
      createdAt: Date;
      friendshipId: number;
      id: number;
      username: string;
    }[]
  > {
    const friendships = await this.prisma.friendship.findMany({
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
        status: FriendshipStatus.ACCEPTED,
      },
    });
    return friendships.map((f) => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      return {
        campus: friend.campus,
        createdAt: f.createdAt,
        friendshipId: f.id,
        id: friend.id,
        username: friend.username,
      };
    });
  }

  public async removeFriend(userId: number, friendId: number): Promise<{ message: string }> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
        status: FriendshipStatus.ACCEPTED,
      },
    });

    if (!friendship) {
      throw new NotFoundException("Friendship not found");
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });
    this.chatGateway.emitToUser(userId, "friend:removed", { friendId });
    this.chatGateway.emitToUser(friendId, "friend:removed", { friendId: userId });

    return { message: "Friend removed successfully" };
  }
}
