import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JwtPayload } from '../auth/interfaces/auth.interfaces';
import { RedisService } from '../redis/redis.service';

export interface SocketAuth {
  userId: string;
  username: string;
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
    return { userId: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}
