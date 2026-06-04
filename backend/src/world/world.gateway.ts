import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { authenticateSocket } from '../friends/socket-auth';
import { RedisService } from '../redis/redis.service';
import { WorldBlockDto } from './dto/save-blocks.dto';
import { WorldService } from './world.service';

/** World bounds used to reject out-of-range edits (see worldScene constants). */
const MAP_WIDTH = 512;
const MAP_HEIGHT = 64;
const MAX_BLOCK = 12;
const MAX_ROTATION = 63; // 2 bits per X/Y/Z axis
const MAX_BATCH = 4096;

interface EditPayload {
  campusId?: string;
  personalWorld?: boolean;
  blocks?: unknown;
}

/**
 * A player's last known transform. `p`/`r` is the body; in freecam `c`/`cr` is
 * the flying camera, so peers can see both the avatar and the camera marker.
 */
interface PlayerState {
  u: string;
  a: string | null;
  p: [number, number, number];
  r: number;
  m: 'player' | 'freecam';
  c?: [number, number, number];
  cr?: number;
  cp?: number;
}

/**
 * Real-time sync for campus worlds. Every client editing a campus joins that
 * campus's room, so block edits are only relayed to the other players on the
 * same island. Edits are broadcast first (low latency) then persisted.
 *
 * Mounted on the `/world` namespace of the shared `/ws/socket.io` endpoint.
 */
@WebSocketGateway({
  path: '/ws/socket.io',
  namespace: '/world',
  cors: { origin: true, credentials: true },
})
export class WorldGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  /** Last known transform of every connected player, per campus room. */
  private readonly players = new Map<string, Map<string, PlayerState>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly world: WorldService,
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
    client.data.userId = auth.userId;
    client.data.username = auth.username;
    client.data.avatar = auth.avatar;
  }

  handleDisconnect(client: Socket): void {
    this.leaveCampus(client);
  }

  /** Join a campus world room (leaving any previously joined one). */
  @SubscribeMessage('world:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { campusId?: string; personalWorld?: boolean },
  ): void {
    const campusId = body?.campusId;
    const personalWorld = body?.personalWorld;

    this.leaveCampus(client);

    if (personalWorld) {
      const room = `world:personal:${client.data.userId}`;
      void client.join(room);
      client.data.personalWorld = true;
      return;
    }

    if (!campusId) return;

    void client.join(this.room(campusId));
    client.data.campusId = campusId;

    // Send the joining client the players already on this island.
    const room = this.players.get(campusId);
    if (room) {
      const others = [...room.entries()]
        .filter(([id]) => id !== client.id)
        .map(([id, state]) => ({ id, ...state }));
      if (others.length > 0) client.emit('world:players', others);
    }
  }

  /** Leave a campus world room. */
  @SubscribeMessage('world:leave')
  handleLeave(@ConnectedSocket() client: Socket): void {
    this.leaveCampus(client);
  }

  /**
   * Relay a player's transform to the other players on the same island and
   * remember it, so newcomers can be shown where everyone stands.
   */
  @SubscribeMessage('player:move')
  handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      campusId?: string;
      personalWorld?: boolean;
      p?: unknown;
      r?: unknown;
      m?: unknown;
      c?: unknown;
      cr?: unknown;
      cp?: unknown;
    },
  ): void {
    const campusId = body?.campusId;
    const personalWorld = body?.personalWorld;

    const room = personalWorld
      ? `world:personal:${client.data.userId}`
      : campusId
        ? this.room(campusId)
        : null;

    if (!room || !client.rooms.has(room)) return;

    const username = (client.data.username as string) || 'Unknown';
    const avatar = (client.data.avatar as string | null) || null;
    const state = this.sanitizeTransform(
      username,
      avatar,
      body.p,
      body.r,
      body.m,
      body.c,
      body.cr,
      body.cp,
    );
    if (!state) return;

    if (campusId) {
      let roomPlayers = this.players.get(campusId);
      if (!roomPlayers) {
        roomPlayers = new Map();
        this.players.set(campusId, roomPlayers);
      }
      roomPlayers.set(client.id, state);
    }

    client.to(room).emit('player:move', { id: client.id, ...state });
  }

  /**
   * Relay a batch of block edits to the other players on the same island, then
   * persist them. The sender already applied the edits locally, so it is
   * excluded from the broadcast.
   */
  @SubscribeMessage('world:edit')
  async handleEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: EditPayload,
  ): Promise<void> {
    const campusId = body?.campusId;
    const personalWorld = body?.personalWorld;

    const room = personalWorld
      ? `world:personal:${client.data.userId}`
      : campusId
        ? this.room(campusId)
        : null;

    if (!room || !client.rooms.has(room)) return;

    const blocks = this.sanitize(body.blocks);
    if (blocks.length === 0) return;

    client.to(room).emit('world:edit', { blocks });

    try {
      //if (personalWorld) {
      //  await this.world.saveUserBlocks(client.data.userId, blocks);
      //} else 
      if (campusId) {
        await this.world.saveBlocks(campusId, blocks);
      }
    } catch {
      /* a failed persist should not break the live relay */
    }
  }

  private room(campusId: string): string {
    return `world:${campusId}`;
  }

  /** Remove the client from its current campus and tell the others it left. */
  private leaveCampus(client: Socket): void {
    const campusId = client.data.campusId as string | undefined;
    const personalWorld = client.data.personalWorld as boolean | undefined;

    if (personalWorld) {
      const room = `world:personal:${client.data.userId}`;
      void client.leave(room);
      delete client.data.personalWorld;
      return;
    }

    if (!campusId) return;
    delete client.data.campusId;

    const room = this.room(campusId);
    void client.leave(room);

    const roomPlayers = this.players.get(campusId);
    if (roomPlayers?.delete(client.id) && roomPlayers.size === 0) {
      this.players.delete(campusId);
    }
    client.to(room).emit('player:leave', { id: client.id });
  }

  /** Validate an incoming transform; returns null if malformed. */
  private sanitizeTransform(
    username: string,
    avatar: string | null,
    p: unknown,
    r: unknown,
    m: unknown,
    c: unknown,
    cr: unknown,
    cp: unknown,
  ): PlayerState | null {
    const pos = this.toVec3(p);
    if (!pos || typeof r !== 'number' || !Number.isFinite(r)) return null;

    const mode = m === 'freecam' ? 'freecam' : 'player';
    const state: PlayerState = { u: username, a: avatar, p: pos, r, m: mode };

    if (typeof cp === 'number' && Number.isFinite(cp)) {
      state.cp = cp;
    }

    // The camera marker is only relevant (and trusted) in freecam.
    if (mode === 'freecam') {
      const cam = this.toVec3(c);
      if (cam && typeof cr === 'number' && Number.isFinite(cr)) {
        state.c = cam;
        state.cr = cr;
      }
    }
    return state;
  }

  private toVec3(v: unknown): [number, number, number] | null {
    if (!Array.isArray(v) || v.length !== 3) return null;
    if (!v.every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
    return [v[0], v[1], v[2]];
  }

  /** Keep only well-formed, in-bounds edits and cap the batch size. */
  private sanitize(raw: unknown): WorldBlockDto[] {
    if (!Array.isArray(raw)) return [];
    const blocks: WorldBlockDto[] = [];
    for (const item of raw) {
      if (blocks.length >= MAX_BATCH) break;
      if (!item || typeof item !== 'object') continue;
      const { x, y, z, block, rotation } = item as Record<string, unknown>;
      if (
        Number.isInteger(x) &&
        Number.isInteger(y) &&
        Number.isInteger(z) &&
        Number.isInteger(block) &&
        (x as number) >= 0 &&
        (x as number) < MAP_WIDTH &&
        (z as number) >= 0 &&
        (z as number) < MAP_WIDTH &&
        (y as number) >= 0 &&
        (y as number) < MAP_HEIGHT &&
        (block as number) >= 0 &&
        (block as number) <= MAX_BLOCK
      ) {
        const rot =
          Number.isInteger(rotation) &&
          (rotation as number) >= 0 &&
          (rotation as number) <= MAX_ROTATION
            ? (rotation as number)
            : 0;
        blocks.push({
          x: x as number,
          y: y as number,
          z: z as number,
          block: block as number,
          rotation: rot,
        });
      }
    }
    return blocks;
  }
}
