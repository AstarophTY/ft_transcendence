import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SELF_USER_SELECT, SelfUser } from './users.select';
import { UpdateProfileDto } from './dto/update-profile.dto';

/** Username may only be changed once every 30 days. */
export const USERNAME_COOLDOWN_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  getMe(userId: string): Promise<SelfUser | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: SELF_USER_SELECT,
    });
  }

  /** Update freely-editable fields + optional avatar URL. */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    avatar?: string,
  ): Promise<SelfUser> {
    if (dto.email !== undefined) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.fortyTwoId) {
        throw new BadRequestException('42 accounts cannot change their email');
      }
      const taken = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: userId } },
      });
      if (taken) throw new ConflictException('Email already in use');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { ...dto, ...(avatar !== undefined ? { avatar } : {}) },
      select: SELF_USER_SELECT,
    });
  }

  /** Persist a freshly uploaded avatar URL. */
  setAvatar(userId: string, avatar: string): Promise<SelfUser> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar },
      select: SELF_USER_SELECT,
    });
  }

  /** Change username, enforcing the 30-day cooldown. */
  async changeUsername(userId: string, username: string): Promise<SelfUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const remaining = this.cooldownRemaining(user.usernameChangedAt);
    if (remaining > 0) {
      throw new BadRequestException(
        `You can change your username again in ${remaining} day(s)`,
      );
    }
    if (await this.prisma.user.findUnique({ where: { username } })) {
      throw new ConflictException('Username already taken');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { username, usernameChangedAt: new Date() },
      select: SELF_USER_SELECT,
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      throw new BadRequestException('This account has no password set');
    }
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });
  }

  /** Days left before the username can change again (0 if allowed now). */
  private cooldownRemaining(changedAt: Date | null): number {
    if (!changedAt) return 0;
    const elapsed = Date.now() - changedAt.getTime();
    const left = Math.ceil((USERNAME_COOLDOWN_DAYS * DAY_MS - elapsed) / DAY_MS);
    return Math.max(0, left);
  }
}
