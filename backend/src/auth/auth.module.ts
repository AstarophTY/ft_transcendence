import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CampusModule } from '../campus/campus.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FortyTwoOAuthFilter } from './filters/forty-two-oauth.filter';
import { FortyTwoModule } from './forty-two.module';
import { FortyTwoAuthGuard } from './guards/forty-two-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { FortyTwoStrategy } from './strategies/forty-two.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WorldModule } from '../world/world.module';

@Module({
  imports: [
    CampusModule,
    UsersModule,
    FortyTwoModule,
    WorldModule,
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    FortyTwoStrategy,
    JwtAuthGuard,
    FortyTwoAuthGuard,
    FortyTwoOAuthFilter,
    RolesGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
