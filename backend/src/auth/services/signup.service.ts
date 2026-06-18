import { Injectable, ConflictException } from '@nestjs/common';
import { SignupDto } from '@/auth/dto/signup.dto';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SignupService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(signupDto: SignupDto) {
    const { username, password } = signupDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Save user to database
    const user = await this.prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }
}
