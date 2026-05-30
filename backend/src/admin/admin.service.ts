import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ADMIN_USER_SELECT, AdminUser } from '../users/users.select';

export interface AdminStats {
  total: number;
  admins: number;
  users: number;
  fortyTwo: number;
  local: number;
  newLast7Days: number;
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

  async deleteUser(adminId: string, userId: string): Promise<void> {
    if (adminId === userId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    await this.prisma.user.delete({ where: { id: userId } });
  }
}
