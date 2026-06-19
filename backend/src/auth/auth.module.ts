import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { LoginController } from '@/auth/controllers/login.controller';
import { SignupController } from '@/auth/controllers/signup.controller';
import { FortyTwoController } from '@/auth/controllers/fortytwo.controller';
import { LoginService } from '@/auth/services/login.service';
import { SignupService } from '@/auth/services/signup.service';
import { FortyTwoService } from '@/auth/services/fortytwo.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { FriendsModule } from '@/friends/friends.module';
import { ChatModule } from '@/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<any>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
    FriendsModule,
    ChatModule,
  ],
  controllers: [LoginController, SignupController, FortyTwoController],
  providers: [
    LoginService,
    SignupService,
    FortyTwoService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [JwtModule],
})
export class AuthModule {}


