import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ADMIN_USER_SELECT, AdminUser } from '../users/users.select';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

export interface AdminStats {
  total: number;
  admins: number;
  users: number;
  fortyTwo: number;
  local: number;
  newLast7Days: number;
}

/** One point of the signups-per-day chart. */
export interface SignupPoint {
  date: string;
  count: number;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every account (most recent first). */
  listUsers(): Promise<AdminUser[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: ADMIN_USER_SELECT,
    });
  }

  /** Aggregate counts for the dashboard. */
  async getStats(): Promise<AdminStats> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [total, admins, fortyTwo, newLast7Days] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.user.count({ where: { fortyTwoId: { not: null } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);
    return {
      total,
      admins,
      users: total - admins,
      fortyTwo,
      local: total - fortyTwo,
      newLast7Days,
    };
  }

  async setRole(
    adminId: string,
    userId: string,
    role: Role,
  ): Promise<AdminUser> {
    if (adminId === userId) {
      throw new BadRequestException('You cannot change your own role');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: ADMIN_USER_SELECT,
    });
  }

  /** New-account counts for each of the last `days` days (oldest first). */
  async getSignupsByDay(days = 14): Promise<SignupPoint[]> {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return [...buckets.entries()].map(([date, count]) => ({ date, count }));
  }

  /** Admin override: edit any user's profile fields (incl. email). */
  async updateUser(userId: string, dto: AdminUpdateUserDto): Promise<AdminUser> {
    const { campus, ...rest } = dto;
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...rest,
        ...(campus ? { campus: this.campusRelation(campus) } : {}),
      },
      select: ADMIN_USER_SELECT,
    });
  }

  /** Admin override: set a new password (local accounts only). */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.fortyTwoId) {
      throw new BadRequestException('42 accounts have no password');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });
  }

  async deleteUser(adminId: string, userId: string): Promise<void> {
    if (adminId === userId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    await this.prisma.user.delete({ where: { id: userId } });
  }

  private campusRelation(
    label: string,
  ): Prisma.CampusCreateNestedOneWithoutUsersInput {
    return {
      connectOrCreate: {
        where: { label },
        create: { label },
      },
    };
  }
}
