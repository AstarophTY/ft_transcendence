import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class FortyTwoService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  getAuthUrl(): string {
    const clientId = this.config.get<string>('API_42_CLIENT_ID');
    const redirectUri = this.config.get<string>('API_42_REDIRECT_URI');
    
    if (!clientId || !redirectUri) {
      throw new Error('42 OAuth configuration is missing in environment variables');
    }

    return `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=public`;
  }

  async login(code: string): Promise<string> {
    const clientId = this.config.get<string>('API_42_CLIENT_ID');
    const clientSecret = this.config.get<string>('API_42_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('API_42_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new UnauthorizedException('42 OAuth configuration is missing');
    }

    const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('Failed to exchange code for 42 token:', errBody);
      throw new UnauthorizedException('Failed to authenticate with 42 API');
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string };
    const accessToken = tokenData.access_token;

    const profileResponse = await fetch('https://api.intra.42.fr/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      throw new UnauthorizedException('Failed to retrieve 42 user profile');
    }

    const profileData = (await profileResponse.json()) as {
      login: string;
      campus?: { id: number; name: string }[];
      campus_users?: { campus_id: number; is_primary: boolean }[];
    };
    const fortyTwoUsername = profileData.login;

    let campus: string | null = null;
    if (profileData.campus_users && profileData.campus) {
      const primaryCampusUser = profileData.campus_users.find((cu) => cu.is_primary);
      if (primaryCampusUser) {
        const primaryCampus = profileData.campus.find((c) => c.id === primaryCampusUser.campus_id);
        if (primaryCampus) {
          campus = primaryCampus.name;
        }
      }
    }
    if (!campus && profileData.campus && profileData.campus.length > 0) {
      campus = profileData.campus[0].name;
    }

    if (!fortyTwoUsername) {
      throw new UnauthorizedException('Invalid 42 user profile data');
    }

    let user = await this.prisma.user.findUnique({
      where: { username: fortyTwoUsername },
    });
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await this.prisma.user.create({
        data: {
          username: fortyTwoUsername,
          passwordHash,
          campus,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          campus,
        },
      });
    }

    const payload = { sub: user.id, username: user.username };
    return this.jwtService.signAsync(payload);
  }
}
