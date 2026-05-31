import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    this.client = url
      ? new Redis(url)
      : new Redis({
          host: this.config.get<string>('REDIS_HOST', 'localhost'),
          port: this.config.get<number>('REDIS_PORT', 6379),
          password: this.config.get<string>('REDIS_PASSWORD'),
        });
  }

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.client.set(`blacklist:${jti}`, '1', 'EX', ttlSeconds);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    return (await this.client.exists(`blacklist:${jti}`)) === 1;
  }

  async cacheUser(userId: string, data: object, ttlSeconds = 300): Promise<void> {
    await this.client.set(`user:${userId}`, JSON.stringify(data), 'EX', ttlSeconds);
  }

  async getCachedUser<T = unknown>(userId: string): Promise<T | null> {
    const data = await this.client.get(`user:${userId}`);
    return data ? (JSON.parse(data) as T) : null;
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.client.del(`user:${userId}`);
  }

  async incrementLoginAttempts(identifier: string): Promise<number> {
    const key = `login_attempts:${identifier}`;
    const attempts = await this.client.incr(key);
    if (attempts === 1) {
      await this.client.expire(key, 900);
    }
    return attempts;
  }

  async resetLoginAttempts(identifier: string): Promise<void> {
    await this.client.del(`login_attempts:${identifier}`);
  }

  async getRaw(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async setRaw(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  onModuleDestroy(): void {
    void this.client.quit();
  }
}
