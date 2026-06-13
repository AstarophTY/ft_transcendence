import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { GlobalThrottlerGuard } from './common/guards/global-throttler.guard';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CampusModule } from './campus/campus.module';
import { FriendsModule } from './friends/friends.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { SeasonModule } from './season/season.module';
import { UsersModule } from './users/users.module';
import { WorldModule } from './world/world.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    UsersModule,
    AuthModule,
    CampusModule,
    FriendsModule,
    AdminModule,
    SeasonModule,
    WorldModule,
  ],
  providers: [
    // Activate the configured rate-limiter globally (HTTP routes only).
    { provide: APP_GUARD, useClass: GlobalThrottlerGuard },
  ],
})
export class AppModule {}
