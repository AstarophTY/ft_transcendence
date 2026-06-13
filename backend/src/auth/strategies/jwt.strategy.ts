import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../../redis/redis.service';
import { AuthUser, JwtPayload } from '../interfaces/auth.interfaces';
import { JWT_ALGORITHM, getJwtPublicKey } from '../jwt-keys';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Verify the RS256 signature with the public key only.
      secretOrKey: getJwtPublicKey(config),
      algorithms: [JWT_ALGORITHM],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (await this.redis.isTokenBlacklisted(payload.jti)) {
      throw new UnauthorizedException('Token revoked');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
    };
  }
}
