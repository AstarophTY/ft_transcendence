import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
import { RedisService } from '../redis/redis.service';
import { FriendsService } from './friends.service';
import { PresenceService } from './presence.service';
import { authenticateSocket } from './socket-auth';

/**
 * Real-time channel for friends: presence, requests and messages. Mounted
 * under `/ws/` — the only nginx location that forwards WebSocket upgrades.
 */
@WebSocketGateway({
  path: '/ws/socket.io',
  cors: { origin: true, credentials: true },
})
export class FriendsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() private readonly server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly friends: FriendsService,
    private readonly presence: PresenceService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const auth = await authenticateSocket(
      client,
      this.jwt,
      this.redis,
      this.config,
    );
    if (!auth) {
      client.disconnect();
      return;
    }

    const { userId, username } = auth;
    client.data.userId = userId;
    client.data.username = username;

    // Disconnect any existing connection for this user
    const existingSockets = await this.server.fetchSockets();
    for (const socket of existingSockets) {
      if (socket.data.userId === userId && socket.id !== client.id) {
        socket.emit('auth:kick', { reason: 'concurrent_login' });
        socket.disconnect(true);
      }
    }

    void client.join(userId);
    void client.join('server');
    const cameOnline = this.presence.add(auth.userId, client.id);

    const friends = await this.friends.listFriends(userId);
    if (cameOnline) this.broadcast(friends, userId, 'friend:online');
    client.emit('presence:init', {
      online: friends.filter((f) => this.presence.isOnline(f.id)).map((f) => f.id),
    });
  }

  @SubscribeMessage('server:chat')
  handleServerChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { content: string },
  ): void {
    const userId = client.data.userId as string | undefined;
    const username = client.data.username as string | undefined;
    if (!userId || !username) return;
    const content = (body.content ?? '').trim().slice(0, 200);
    if (!content) return;
    this.server.to('server').emit('server:chat:message', {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      senderId: userId,
      senderName: username,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId || !this.presence.remove(userId, client.id)) return;
    const friends = await this.friends.listFriends(userId);
    this.broadcast(friends, userId, 'friend:offline');
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(userId).emit(event, payload);
  }

  /**
   * Tell every connected client a user swapped their avatar, so open friend
   * lists, chats and the admin table refresh the picture live instead of
   * showing a stale one until reload. Everyone joins the `server` room on
   * connect, so a single emit reaches all of them.
   */
  broadcastAvatar(userId: string, avatar: string | null): void {
    this.server.to('server').emit('user:avatar', { userId, avatar });
  }

  /** After two users become friends, sync each other's online status. */
  syncNewFriendship(a: string, b: string): void {
    if (this.presence.isOnline(b)) this.emitToUser(a, 'friend:online', { userId: b });
    if (this.presence.isOnline(a)) this.emitToUser(b, 'friend:online', { userId: a });
  }

  private broadcast(
    friends: { id: string }[],
    userId: string,
    event: string,
  ): void {
    for (const friend of friends) {
      if (this.presence.isOnline(friend.id)) {
        this.emitToUser(friend.id, event, { userId });
      }
    }
  }
}
