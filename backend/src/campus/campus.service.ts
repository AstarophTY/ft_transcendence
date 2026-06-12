import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Campus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FriendsGateway } from '../friends/friends.gateway';
import { generateWorldProfile } from '../world/world.profile';
import { WorldGateway } from '../world/world.gateway';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';

/** A campus together with the accounts attached to it (admin view). */
const CAMPUS_WITH_MEMBERS = {
  orderBy: { label: 'asc' },
  include: {
    world: {
      select: { seed: true },
    },
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly worldGateway: WorldGateway,
    private readonly friendsGateway: FriendsGateway,
  ) {}

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

  /**
   * Admin: create a campus from just a name, along with its planet. Members can
   * then be attached one by one.
   */
  async create(dto: CreateCampusDto): Promise<Campus> {
    const label = dto.label.trim();
    const clash = await this.prisma.campus.findUnique({ where: { label } });
    if (clash) {
      throw new ConflictException('A campus with this name already exists');
    }

    const campus = await this.prisma.campus.create({ data: { label } });
    await this.prisma.world.create({
      data: { campusId: campus.id, ...generateWorldProfile(campus.id) },
    });
    return campus;
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

    const { seed, regenerate, ...rest } = dto;

    if (seed !== undefined || regenerate) {
      const world = await this.prisma.world.findUnique({ where: { campusId: id } });
      if (world) {
        if (regenerate) {
          const { generateWorldProfile } = await import('../world/world.profile');
          const profile = generateWorldProfile(id);
          await this.prisma.$transaction([
            this.prisma.worldBlock.deleteMany({ where: { worldId: world.id } }),
            this.prisma.world.update({
              where: { id: world.id },
              data: { ...profile, updatedAt: new Date() },
            }),
          ]);
        } else if (seed !== undefined) {
          await this.prisma.world.update({
            where: { id: world.id },
            data: { seed, updatedAt: new Date() },
          });
        }
      }
    }

    const updated = await this.prisma.campus.update({ where: { id }, data: rest });
    if (dto.coins !== undefined) {
      await this.worldGateway.broadcastCampusCoins(id);
    }
    return updated;
  }

  /** Admin: delete a campus; its members are detached automatically. */
  async remove(id: string): Promise<void> {
    await this.requireCampus(id);
    await this.prisma.campus.delete({ where: { id } });
  }

  /** Admin: attach a single user to a campus. */
  async addMember(campusId: string, userId: string): Promise<void> {
    const campus = await this.requireCampus(campusId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({
      where: { id: userId },
      data: { campusId },
    });

    // Let the user build right away, without re-logging in: authorize their open
    // world sockets and push the new campus to their client.
    await this.worldGateway.setUserCampus(userId, campusId);
    this.friendsGateway.emitToUser(userId, 'campus:assigned', {
      campusId,
      label: campus.label,
    });
  }

  /** Admin: detach a single member from a campus. */
  async removeMember(campusId: string, userId: string): Promise<void> {
    const { count } = await this.prisma.user.updateMany({
      where: { id: userId, campusId },
      data: { campusId: null },
    });
    if (count === 0) return;

    // Revoke build rights live, mirroring addMember.
    await this.worldGateway.setUserCampus(userId, null);
    this.friendsGateway.emitToUser(userId, 'campus:removed', { campusId });
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
