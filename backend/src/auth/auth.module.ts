import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FortyTwoAuthGuard } from './guards/forty-two-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { FortyTwoStrategy } from './strategies/forty-two.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [UsersModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    FortyTwoStrategy,
    JwtAuthGuard,
    FortyTwoAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
