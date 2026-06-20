import { Inject, Logger, forwardRef } from "@nestjs/common";
import type { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { OnlineUsersService } from "@/chat/services/online-users.service";
import { ChatService } from "@/chat/services/chat.service";
import { FriendshipsService } from "@/friends/services/friendships.service";

@WebSocketGateway({
  cors: {
    credentials: true,
    origin: "*",
  },
  path: "/ws",
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  public constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly onlineUsersService: OnlineUsersService,
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => FriendshipsService))
    private readonly friendshipsService: FriendshipsService,
  ) {}

  public async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization;

      if (!token) {
        this.logger.warn(`Disconnecting client ${client.id}: No token provided`);
        client.disconnect();
        return;
      }

      const jwtToken = token.startsWith("Bearer ") ? token.slice(7) : token;

      const payload = await this.jwtService.verifyAsync(jwtToken, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });

      client.data.user = payload;
      const userId = payload.sub;

      this.onlineUsersService.addSocket(userId, client.id);
      this.logger.log(`User ${payload.username} (ID: ${userId}) connected on socket ${client.id}`);

      await this.broadcastPresence(userId, "ONLINE");

      const friends = await this.friendshipsService.getFriends(userId);
      const onlineFriendIds = friends
        .filter((f) => this.onlineUsersService.isOnline(f.id))
        .map((f) => f.id);

      client.emit("friends:online_list", onlineFriendIds);
    } catch (error) {
      this.logger.error(`Connection authentication failed: ${(error as Error).message}`);
      client.disconnect();
    }
  }

  public async handleDisconnect(client: Socket): Promise<void> {
    const { user } = client.data;
    if (user) {
      const userId = user.sub;
      this.onlineUsersService.removeSocket(userId, client.id);
      this.logger.log(`User ${user.username} (ID: ${userId}) disconnected socket ${client.id}`);

      if (!this.onlineUsersService.isOnline(userId)) {
        await this.broadcastPresence(userId, "OFFLINE");
      }
    }
  }

  @SubscribeMessage("dm:send")
  public async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: number; content: string },
  ): Promise<void> {
    const { user } = client.data;
    if (!user) {
      return;
    }

    const senderId = user.sub;
    const { receiverId, content } = data;

    if (!receiverId || !content || content.trim().length === 0) {
      return;
    }

    try {
      const message = await this.chatService.saveMessage(senderId, receiverId, content);

      const receiverSockets = this.onlineUsersService.getSockets(receiverId);
      for (const socketId of receiverSockets) {
        this.server.to(socketId).emit("dm:message", message);
      }

      const senderSockets = this.onlineUsersService.getSockets(senderId);
      for (const socketId of senderSockets) {
        this.server.to(socketId).emit("dm:sent", message);
      }
    } catch (error) {
      this.logger.error(`Failed to send message: ${(error as Error).message}`);
      client.emit("error", { message: "Failed to send message" });
    }
  }

  @SubscribeMessage("global:send")
  public async handleSendGlobalMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { content: string },
  ): Promise<void> {
    const { user } = client.data;
    if (!user) {
      return;
    }

    const senderId = user.sub;
    const { content } = data;

    if (!content || content.trim().length === 0) {
      return;
    }

    try {
      const message = await this.chatService.saveGlobalMessage(senderId, content);
      this.server.emit("global:message", message);
    } catch (error) {
      this.logger.error(`Failed to send global message: ${(error as Error).message}`);
      client.emit("error", { message: "Failed to send global message" });
    }
  }

  private async broadcastPresence(userId: number, status: "ONLINE" | "OFFLINE"): Promise<void> {
    try {
      const friends = await this.friendshipsService.getFriends(userId);
      const user = await this.friendshipsService.prisma.user.findUnique({
        select: { id: true, username: true },
        where: { id: userId },
      });

      if (!user) {
        return;
      }

      for (const friend of friends) {
        const friendSockets = this.onlineUsersService.getSockets(friend.id);
        for (const socketId of friendSockets) {
          this.server.to(socketId).emit("presence:change", {
            status,
            userId,
            username: user.username,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to broadcast presence: ${(error as Error).message}`);
    }
  }

  public emitToUser(userId: number, event: string, data: unknown): void {
    const sockets = this.onlineUsersService.getSockets(userId);
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }
  }
}
