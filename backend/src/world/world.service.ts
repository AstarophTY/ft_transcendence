import { Injectable, NotFoundException } from '@nestjs/common';
import { Campus, User, World } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorldBlockDto } from './dto/save-blocks.dto';
import { AIR, isPaidBlock } from './world.blocks';
import { generateWorldProfile } from './world.profile';

/**
 * Each campus owns one shared world. The base terrain is regenerated on the
 * client from the stored profile; only player edits (including broken blocks)
 * are persisted here as a diff.
 */
@Injectable()
export class WorldService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One world profile per campus, alphabetical — this drives the planet
   * selection menu (one island per campus). Missing worlds are generated lazily
   * so existing campuses get an island on first view.
   */
  async listWorlds() {
    const campuses = await this.prisma.campus.findMany({
      orderBy: { label: 'asc' },
      include: {
        world: {
          include: { blocks: true },
        },
      },
    });

    const worlds = [];
    for (const campus of campuses) {
      const world = campus.world ?? (await this.createWorld(campus.id));
      worlds.push({
        campusId: campus.id,
        label: campus.label,
        seed: world.seed,
        widthInChunks: world.widthInChunks,
        depthInChunks: world.depthInChunks,
        scale: world.scale,
        octaves: world.octaves,
        persistence: world.persistence,
        relief: world.relief,
        baseHeight: world.baseHeight,
        variationRange: world.variationRange,
        blocks: 'blocks' in world ? world.blocks : [],
      });
    }
    return worlds;
  }

  /** A campus or personal world: its generation profile plus every persisted block edit. */
  async getWorld(id: string) {
    // Attempt to resolve the world as a personal planet first, then fallback to campus.
    // ensureWorld handles lazy creation if it was somehow missed during login.
    let world: World;
    try {
      world = await this.ensureWorld(id, true);
    } catch {
      world = await this.ensureWorld(id, false);
    }

    const blocks = await this.prisma.worldBlock.findMany({
      where: { worldId: world.id },
      select: { x: true, y: true, z: true, block: true, rotation: true, block_log: false },
    });
    return {
      campusId: world.campusId ?? world.userId ?? id,
      seed: world.seed,
      widthInChunks: world.widthInChunks,
      depthInChunks: world.depthInChunks,
      scale: world.scale,
      octaves: world.octaves,
      persistence: world.persistence,
      relief: world.relief,
      baseHeight: world.baseHeight,
      variationRange: world.variationRange,
      blocks,
    };
  }

  async saveBlocks(id: string, blocks: WorldBlockDto[], userId: string): Promise<void> {
    if (blocks.length === 0)
      return;

    let world: World;
    try {
      world = await this.ensureWorld(id, true);
    } catch {
      world = await this.ensureWorld(id, false);
    }

    await this.prisma.$transaction(async (tx) => {
      for (const b of blocks) {
        const rotation = b.rotation ?? 0;

        await tx.worldBlock.upsert({
          where: {
            worldId_x_y_z: {
              worldId: world.id,
              x: b.x,
              y: b.y,
              z: b.z,
            },
          },
          create: {
            worldId: world.id,
            x: b.x,
            y: b.y,
            z: b.z,
            block: b.block,
            rotation,
            block_log: {
              create: {
                userId,
                date: new Date(),
                placedBlock: b.block,
              },
            },
          },
          update: {
            block: b.block,
            rotation,
            block_log: {
              create: {
                userId,
                date: new Date(),
                placedBlock: b.block,
              },
            },
          },
        });
      }
    }, {
      timeout: 10000, // Increase timeout for large batches
    });
  }
  /**
   * Apply a batch of edits with the campus-coin economy:
   * - placing a paid block costs 1 campus coin (rejected when the campus has 0);
   * - breaking a previously placed paid block refunds 1 campus coin;
   * - free (world-construction) blocks are unaffected.
   *
   * The build budget is the campus's coins (the value admins set in the panel).
   * Returns the applied edits, the positions rejected for lack of coins, and the
   * campus's new coin balance.
   */
  async applyEdits(
    campusId: string,
    blocks: WorldBlockDto[],
    userId: string,
  ): Promise<{
    applied: WorldBlockDto[];
    rejected: { x: number; y: number; z: number }[];
    coins: number;
  }> {
    let world: World;
    try {
      world = await this.ensureWorld(campusId, true);
    } catch {
      world = await this.ensureWorld(campusId, false);
    }

    return await this.prisma.$transaction(async (tx) => {
      // Lock campus record for the duration of the transaction to prevent coin race conditions
      const campus = await tx.campus.findUnique({
        where: { id: campusId },
        select: { coins: true },
      });
      if (!campus) throw new NotFoundException('Campus not found');

      // Query existing blocks in a single batch to calculate costs/refunds correctly
      const existing = await tx.worldBlock.findMany({
        where: {
          worldId: world.id,
          OR: blocks.map((b) => ({ x: b.x, y: b.y, z: b.z })),
        },
        select: { x: true, y: true, z: true, block: true },
      });
      const prev = new Map<string, number>(
        existing.map((e) => [`${e.x},${e.y},${e.z}`, e.block]),
      );

      let coins = campus.coins;
      const applied: WorldBlockDto[] = [];
      const rejected: { x: number; y: number; z: number }[] = [];

      for (const b of blocks) {
        const key = `${b.x},${b.y},${b.z}`;
        if (isPaidBlock(b.block)) {
          if (coins <= 0) {
            rejected.push({ x: b.x, y: b.y, z: b.z });
            continue;
          }
          coins -= 1;
        } else if (b.block === AIR) {
          const before = prev.get(key);
          if (before !== undefined && isPaidBlock(before)) coins += 1;
        }
        applied.push(b);
      }

      for (const b of applied) {
        const rotation = b.rotation ?? 0;
        await tx.worldBlock.upsert({
          where: {
            worldId_x_y_z: { worldId: world.id, x: b.x, y: b.y, z: b.z },
          },
          create: {
            worldId: world.id,
            x: b.x,
            y: b.y,
            z: b.z,
            block: b.block,
            rotation,
            block_log: { create: { userId, date: new Date(), placedBlock: b.block } },
          },
          update: {
            block: b.block,
            rotation,
            block_log: { create: { userId, date: new Date(), placedBlock: b.block } },
          },
        });
      }

      await tx.campus.update({
        where: { id: campusId },
        data: { coins },
      });

      return { applied, rejected, coins };
    }, {
      timeout: 15000, // Higher timeout for economy logic processing
    });
  }

  /** The campus build budget (coins), or null if the campus does not exist. */
  async getCampusCoins(campusId: string): Promise<number | null> {
    const campus = await this.prisma.campus.findUnique({
      where: { id: campusId },
      select: { coins: true },
    });
    return campus?.coins ?? null;
  }

  /** Create a world (with a fresh random profile) for a campus or user. */
  createWorld(ownerId: string, private_planet: boolean = false): Promise<World> {
    if (private_planet)
    {
      return this.prisma.world.create({
        data: {
          userId: ownerId,
          ...generateWorldProfile(ownerId),
          seed: ownerId,
          widthInChunks: 4
        },
      });
    } else {
      return this.prisma.world.create({
        data: { campusId: ownerId, ...generateWorldProfile(ownerId) },
      });
    }
  }

  /** Return the world, creating it on the fly if it does not exist yet. */
  async ensureWorld(worldId: string, is_personal_planet: boolean = false): Promise<World> {
    const world = await this.prisma.world.findUnique({
      where: is_personal_planet ? { userId: worldId } : { campusId: worldId },
    });
    if (world) return world;

    if (!is_personal_planet) {
      const campus: Campus | null = await this.prisma.campus.findUnique({
        where: { id: worldId },
      });
      if (!campus) throw new NotFoundException('Campus not found');
    } else {
      const user: User | null = await this.prisma.user.findUnique({
        where: { id: worldId },
      });
      if (!user) throw new NotFoundException('User not found');
    }
    return this.createWorld(worldId, is_personal_planet);
  }
}
