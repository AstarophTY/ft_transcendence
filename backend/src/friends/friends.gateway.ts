import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
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
    const userId = await authenticateSocket(
      client,
      this.jwt,
      this.redis,
      this.config,
    );
    if (!userId) {
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    void client.join(userId);
    const cameOnline = this.presence.add(userId, client.id);

    const friends = await this.friends.listFriends(userId);
    if (cameOnline) this.broadcast(friends, userId, 'friend:online');
    client.emit('presence:init', {
      online: friends.filter((f) => this.presence.isOnline(f.id)).map((f) => f.id),
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
