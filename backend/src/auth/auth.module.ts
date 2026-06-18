import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoginController } from '@/auth/controllers/login.controller';
import { SignupController } from '@/auth/controllers/signup.controller';
import { LoginService } from '@/auth/services/login.service';
import { SignupService } from '@/auth/services/signup.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
  ],
  controllers: [LoginController, SignupController],
  providers: [
    LoginService,
    SignupService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AuthModule {}
