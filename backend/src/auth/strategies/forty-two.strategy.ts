import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { AuthService } from '../auth.service';
import { AuthTokens } from '../interfaces/auth.interfaces';

interface FortyTwoApiProfile {
  id: number;
  login: string;
  email?: string;
  displayname?: string;
  image?: { link?: string };
}

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, 'forty-two') {
  constructor(
    config: ConfigService,
    private readonly auth: AuthService,
  ) {
    super({
      authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
      tokenURL: 'https://api.intra.42.fr/oauth/token',
      clientID: config.get<string>('API_42_CLIENT_ID') ?? '',
      clientSecret: config.get<string>('API_42_CLIENT_SECRET') ?? '',
      callbackURL: config.get<string>('API_42_REDIRECT_URI') ?? '',
      scope: ['public'],
    });
  }

  async userProfile(
    accessToken: string,
    done: (err: unknown, profile?: FortyTwoApiProfile) => void,
  ): Promise<void> {
    try {
      const res = await fetch('https://api.intra.42.fr/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        return done(new Error(`42 API responded with ${res.status}`));
      }
      done(null, (await res.json()) as FortyTwoApiProfile);
    } catch (err) {
      done(err);
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: FortyTwoApiProfile,
  ): Promise<AuthTokens> {
    return this.auth.validateFortyTwoUser({
      fortyTwoId: profile.id,
      fortyTwoLogin: profile.login,
      email: profile.email,
      avatar: profile.image?.link,
      displayName: profile.displayname,
    });
  }
}
