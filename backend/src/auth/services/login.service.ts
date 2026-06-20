import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { LoginDto } from "@/auth/dto/login.dto";
import { PrismaService } from "@/prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class LoginService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  public async login(loginDto: LoginDto): Promise<{
    message: string;
    user: { id: number; username: string; campus: string | null };
    accessToken: string;
  }> {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = { sub: user.id, username: user.username };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      message: "Login successful",
      user: {
        campus: user.campus,
        id: user.id,
        username: user.username,
      },
    };
  }
}
