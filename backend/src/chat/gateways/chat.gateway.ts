import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import { OnlineUsersService } from '@/chat/services/online-users.service';
import { ChatService } from '@/chat/services/chat.service';
import { FriendshipsService } from '@/friends/services/friendships.service';

@WebSocketGateway({
  path: '/ws',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly onlineUsersService: OnlineUsersService,
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => FriendshipsService))
    private readonly friendshipsService: FriendshipsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization;

      if (!token) {
        this.logger.warn(`Disconnecting client ${client.id}: No token provided`);
        client.disconnect();
        return;
      }

      const jwtToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      
      const payload = await this.jwtService.verifyAsync(jwtToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.data.user = payload;
      const userId = payload.sub;

      this.onlineUsersService.addSocket(userId, client.id);
      this.logger.log(`User ${payload.username} (ID: ${userId}) connected on socket ${client.id}`);

      await this.broadcastPresence(userId, 'ONLINE');

      const friends = await this.friendshipsService.getFriends(userId);
      const onlineFriendIds = friends
        .filter((f) => this.onlineUsersService.isOnline(f.id))
        .map((f) => f.id);

      client.emit('friends:online_list', onlineFriendIds);
    } catch (error) {
      this.logger.error(`Connection authentication failed: ${(error as any).message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      const userId = user.sub;
      this.onlineUsersService.removeSocket(userId, client.id);
      this.logger.log(`User ${user.username} (ID: ${userId}) disconnected socket ${client.id}`);

      if (!this.onlineUsersService.isOnline(userId)) {
        await this.broadcastPresence(userId, 'OFFLINE');
      }
    }
  }

  @SubscribeMessage('dm:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: number; content: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const senderId = user.sub;
    const { receiverId, content } = data;

    if (!receiverId || !content || content.trim().length === 0) {
      return;
    }

    try {
      const message = await this.chatService.saveMessage(senderId, receiverId, content);

      const receiverSockets = this.onlineUsersService.getSockets(receiverId);
      for (const socketId of receiverSockets) {
        this.server.to(socketId).emit('dm:message', message);
      }

      const senderSockets = this.onlineUsersService.getSockets(senderId);
      for (const socketId of senderSockets) {
        this.server.to(socketId).emit('dm:sent', message);
      }
    } catch (error) {
      this.logger.error(`Failed to send message: ${(error as any).message}`);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  private async broadcastPresence(userId: number, status: 'ONLINE' | 'OFFLINE') {
    try {
      const friends = await this.friendshipsService.getFriends(userId);
      const user = await this.friendshipsService.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
      });

      if (!user) return;

      for (const friend of friends) {
        const friendSockets = this.onlineUsersService.getSockets(friend.id);
        for (const socketId of friendSockets) {
          this.server.to(socketId).emit('presence:change', {
            userId,
            username: user.username,
            status,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to broadcast presence: ${(error as any).message}`);
    }
  }

  emitToUser(userId: number, event: string, data: any) {
    const sockets = this.onlineUsersService.getSockets(userId);
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }
  }
}
