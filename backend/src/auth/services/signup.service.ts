import { ConflictException, Injectable } from "@nestjs/common";
import type { SignupDto } from "@/auth/dto/signup.dto";
import { PrismaService } from "@/prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class SignupService {
  public constructor(private readonly prisma: PrismaService) {}

  public async signup(signupDto: SignupDto): Promise<{
    message: string;
    user: { id: number; username: string; campus: string | null };
  }> {
    const { username, password } = signupDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      throw new ConflictException("Username already exists");
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        passwordHash,
        username,
      },
    });

    return {
      message: "User registered successfully",
      user: {
        campus: user.campus,
        id: user.id,
        username: user.username,
      },
    };
  }
}
