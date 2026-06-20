import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { User } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@/prisma/prisma.service";
import * as bcrypt from "bcrypt";
import * as crypto from "node:crypto";

@Injectable()
export class FortyTwoService {
  private readonly logger = new Logger(FortyTwoService.name);

  public constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  public getAuthUrl(): string {
    const clientId = this.config.get<string>("API_42_CLIENT_ID");
    const redirectUri = this.config.get<string>("API_42_REDIRECT_URI");

    if (!clientId || !redirectUri) {
      throw new Error("42 OAuth configuration is missing in environment variables");
    }

    return `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=public`;
  }

  public async login(code: string): Promise<string> {
    const accessToken = await this.exchangeCodeForToken(code);
    const { username, campus } = await this.fetchProfile(accessToken);
    const user = await this.findOrCreateUser(username, campus);

    const payload = { sub: user.id, username: user.username };
    return this.jwtService.signAsync(payload);
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    const clientId = this.config.get<string>("API_42_CLIENT_ID");
    const clientSecret = this.config.get<string>("API_42_CLIENT_SECRET");
    const redirectUri = this.config.get<string>("API_42_REDIRECT_URI");

    if (!clientId || !clientSecret || !redirectUri) {
      throw new UnauthorizedException("42 OAuth configuration is missing");
    }

    const tokenResponse = await fetch("https://api.intra.42.fr/oauth/token", {
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      this.logger.error(`Failed to exchange code for 42 token: ${errBody}`);
      throw new UnauthorizedException("Failed to authenticate with 42 API");
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string };
    return tokenData.access_token;
  }

  private async fetchProfile(
    accessToken: string,
  ): Promise<{ username: string; campus: string | null }> {
    const profileResponse = await fetch("https://api.intra.42.fr/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      throw new UnauthorizedException("Failed to retrieve 42 user profile");
    }

    const profileData = (await profileResponse.json()) as {
      login: string;
      campus?: { id: number; name: string }[];
      campus_users?: { campus_id: number; is_primary: boolean }[];
    };
    const fortyTwoUsername = profileData.login;

    if (!fortyTwoUsername) {
      throw new UnauthorizedException("Invalid 42 user profile data");
    }

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

    return { campus, username: fortyTwoUsername };
  }

  private async findOrCreateUser(username: string, campus: string | null): Promise<User> {
    let user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await this.prisma.user.create({
        data: {
          campus,
          passwordHash,
          username,
        },
      });
    } else {
      user = await this.prisma.user.update({
        data: {
          campus,
        },
        where: { id: user.id },
      });
    }
    return user;
  }
}
