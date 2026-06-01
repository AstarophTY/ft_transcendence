import { randomUUID } from 'crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { AuthTokens, FortyTwoProfile } from './interfaces/auth.interfaces';

const MAX_LOGIN_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async register(
    email: string,
    username: string,
    password: string,
  ): Promise<AuthTokens> {
    const existing = await this.users.findByEmailOrUsername(email, username);
    if (existing) {
      throw new ConflictException('Email or username already in use');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.users.create({ email, username, passwordHash });

    return this.generateTokens(user);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const attempts = await this.redis.incrementLoginAttempts(email);
    if (attempts > MAX_LOGIN_ATTEMPTS) {
      throw new ForbiddenException('Too many attempts, try again in 15 minutes');
    }

    const user = await this.users.findByEmail(email);
    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.redis.resetLoginAttempts(email);
    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.generateTokens(stored.user);
  }

  async logout(userId: string, jti: string): Promise<void> {
    await this.redis.blacklistToken(
      jti,
      this.durationToSeconds(this.config.get<string>('JWT_EXPIRES_IN', '15m')),
    );
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.redis.invalidateUserCache(userId);
  }

  async validateFortyTwoUser(profile: FortyTwoProfile): Promise<AuthTokens> {
    const linked = await this.users.findByFortyTwoId(profile.fortyTwoId);
    if (linked) {
      const updated = await this.users.update(linked.id, {
        avatar: profile.avatar,
        // Keep campus in sync with 42 on every login.
        ...(profile.campus ? { campus: profile.campus } : {}),
      });
      return this.generateTokens(updated);
    }

    if (profile.email) {
      const sameEmail = await this.users.findByEmail(profile.email);
      if (sameEmail) {
        const merged = await this.users.update(sameEmail.id, {
          fortyTwoId: profile.fortyTwoId,
          fortyTwoLogin: profile.fortyTwoLogin,
          avatar: profile.avatar,
          campus: profile.campus ?? null,
          isVerified: true,
        });
        return this.generateTokens(merged);
      }
    }

    const username = await this.users.generateUniqueUsername(
      profile.fortyTwoLogin,
    );
    const created = await this.users.create({
      fortyTwoId: profile.fortyTwoId,
      fortyTwoLogin: profile.fortyTwoLogin,
      email: profile.email,
      username,
      avatar: profile.avatar,
      campus: profile.campus ?? null,
      displayName: profile.displayName ?? null,
      isVerified: true,
    });

    return this.generateTokens(created);
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const jti = randomUUID();
    const accessTtl = this.durationToSeconds(
      this.config.get<string>('JWT_EXPIRES_IN', '15m'),
    );
    const refreshTtl = this.durationToSeconds(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        {
          sub: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          role: user.role,
          jti,
        },
        {
          secret: this.config.get<string>('JWT_SECRET'),
          expiresIn: accessTtl,
        },
      ),
      this.jwt.signAsync(
        { sub: user.id, jti: randomUUID() },
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshTtl,
        },
      ),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private durationToSeconds(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) {
      return Number(value) || 0;
    }
    const amount = Number(match[1]);
    const unit = match[2];
    const factor = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1;
    return amount * factor;
  }
}
