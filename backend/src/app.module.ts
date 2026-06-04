import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CampusModule } from './campus/campus.module';
import { FriendsModule } from './friends/friends.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
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
    WorldModule,
  ],
})
export class AppModule {}
