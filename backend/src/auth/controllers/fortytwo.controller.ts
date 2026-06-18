import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { FortyTwoService } from '@/auth/services/fortytwo.service';

@ApiTags('auth')
@Controller('auth/42')
export class FortyTwoController {
  constructor(
    private readonly fortyTwoService: FortyTwoService,
    private readonly config: ConfigService,
  ) {}

  @Get('login')
  @ApiOperation({ summary: 'Redirect to 42 OAuth login page' })
  @ApiResponse({ status: 302, description: 'Redirects browser to 42 login portal' })
  login(@Res() res: Response) {
    const url = this.fortyTwoService.getAuthUrl();
    res.redirect(url);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Callback for 42 OAuth authentication' })
  @ApiResponse({ status: 302, description: 'Authenticates and redirects back to frontend with JWT token' })
  async callback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      throw new BadRequestException('Authorization code is missing');
    }

    try {
      const token = await this.fortyTwoService.login(code);
      const frontendUrl = this.config.get<string>('FRONTEND_URL', 'https://localhost');

      res.redirect(`${frontendUrl}/?token=${token}`);
    } catch (error) {
      console.error('OAuth callback failed:', error);
      const frontendUrl = this.config.get<string>('FRONTEND_URL', 'https://localhost');
      res.redirect(`${frontendUrl}/?error=unauthorized`);
    }
  }
}
