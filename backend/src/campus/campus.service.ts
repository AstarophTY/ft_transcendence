import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Campus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateWorldProfile } from '../world/world.profile';
import { UpdateCampusDto } from './dto/update-campus.dto';

/** A campus together with the accounts attached to it (admin view). */
const CAMPUS_WITH_MEMBERS = {
  orderBy: { label: 'asc' },
  include: {
    users: {
      select: {
        id: true,
        username: true,
        avatar: true,
        role: true,
        coins: true,
      },
      orderBy: { username: 'asc' },
    },
  },
} as const;

/**
 * Campuses come from 42. They are automatically added to the database on 42 login
 * if they don't exist yet, along with their associated planet.
 */
@Injectable()
export class CampusService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every approved campus, alphabetical. */
  list(): Promise<Campus[]> {
    return this.prisma.campus.findMany({ orderBy: { label: 'asc' } });
  }

  /**
   * Admin view: every campus with its members. `totalCoins` is the sum of the
   * members' earned coins plus the campus's admin bonus (`coins`).
   */
  async listWithMembers() {
    const campuses = await this.prisma.campus.findMany(CAMPUS_WITH_MEMBERS);
    return campuses.map((campus) => ({
      ...campus,
      totalCoins:
        campus.coins + campus.users.reduce((sum, u) => sum + u.coins, 0),
    }));
  }

  /** Admin: rename a campus and/or set its coin balance. */
  async update(id: string, dto: UpdateCampusDto): Promise<Campus> {
    await this.requireCampus(id);
    if (dto.label) {
      const clash = await this.prisma.campus.findUnique({
        where: { label: dto.label },
      });
      if (clash && clash.id !== id) {
        throw new ConflictException('A campus with this name already exists');
      }
    }
    return this.prisma.campus.update({ where: { id }, data: dto });
  }

  /** Admin: delete a campus; its members are detached automatically. */
  async remove(id: string): Promise<void> {
    await this.requireCampus(id);
    await this.prisma.campus.delete({ where: { id } });
  }

  /** Admin: detach a single member from a campus. */
  async removeMember(campusId: string, userId: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: userId, campusId },
      data: { campusId: null },
    });
  }

  private async requireCampus(id: string): Promise<Campus> {
    const campus = await this.prisma.campus.findUnique({ where: { id } });
    if (!campus) throw new NotFoundException('Campus not found');
    return campus;
  }

  /**
   * Run on every 42 login. If the campus already exists the user is attached to
   * it; otherwise it is created automatically.
   */
  async syncFortyTwoCampus(userId: string, label: string): Promise<void> {
    const campus = await this.prisma.campus.upsert({
      where: { label },
      update: {},
      create: { label },
    });

    await this.prisma.world.upsert({
      where: { campusId: campus.id },
      update: {},
      create: { campusId: campus.id, ...generateWorldProfile(campus.id) },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { campusId: campus.id },
    });
  }
}
