import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { FortyTwoAuthGuard } from './guards/forty-two-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthTokens, AuthUser } from './interfaces/auth.interfaces';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthTokens> {
    return this.auth.register(dto.email, dto.username, dto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthTokens> {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto): Promise<AuthTokens> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthUser): Promise<{ success: boolean }> {
    await this.auth.logout(user.userId, user.jti);
    return { success: true };
  }

  @Get('42')
  @UseGuards(FortyTwoAuthGuard)
  fortyTwoLogin(): void {}

  @Get('42/callback')
  @UseGuards(FortyTwoAuthGuard)
  fortyTwoCallback(
    @CurrentUser() tokens: AuthTokens,
    @Res() res: Response,
  ): void {
    const frontend = this.config.get<string>('FRONTEND_URL', 'https://localhost');
    const params = new URLSearchParams({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    if (tokens.isNew) params.set('is_new', '1');
    res.redirect(`${frontend}/?${params.toString()}`);
  }
}
