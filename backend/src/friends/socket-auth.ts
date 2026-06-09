import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JwtPayload } from '../auth/interfaces/auth.interfaces';
import { RedisService } from '../redis/redis.service';

export interface SocketAuth {
  userId: string;
  username: string;
  avatar: string | null;
  /** The user's own campus, or null for guest/non-42 accounts. */
  campusId: string | null;
}

/** Authenticates a socket from its JWT; returns {userId, username} or null. */
export async function authenticateSocket(
  client: Socket,
  jwt: JwtService,
  redis: RedisService,
  config: ConfigService,
): Promise<SocketAuth | null> {
  try {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined);
    if (!token) return null;

    const payload = jwt.verify<JwtPayload>(token, {
      secret: config.get<string>('JWT_SECRET'),
    });
    if (await redis.isTokenBlacklisted(payload.jti)) return null;
    return {
      userId: payload.sub,
      username: payload.username,
      avatar: payload.avatar,
      campusId: payload.campusId ?? null,
    };
  } catch {
    return null;
  }
}
