import { Injectable, NotFoundException } from '@nestjs/common';
import { Campus, World } from '@prisma/client';
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

  /** A campus world: its generation profile plus every persisted block edit. */
  async getWorld(campusId: string) {
    const world = await this.ensureWorld(campusId);
    const blocks = await this.prisma.worldBlock.findMany({
      where: { worldId: world.id },
      select: { x: true, y: true, z: true, block: true, rotation: true, block_log: false },
    });
    return {
      campusId,
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

  async saveBlocks(campusId: string, blocks: WorldBlockDto[], userId: string): Promise<void> {
    if (blocks.length === 0)
      return;

    const world = await this.ensureWorld(campusId);

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

        const oldLogs = await tx.blockLog.findMany({
          where: {
            worldBlockWorldId: world.id,
            worldBlockX: b.x,
            worldBlockY: b.y,
            worldBlockZ: b.z,
          },
          orderBy: {
            date: 'desc',
          },
          skip: 5,
          select: {
            id: true,
          },
        });

        if (oldLogs.length > 0) {
          await tx.blockLog.deleteMany({
            where: {
              id: {
                in: oldLogs.map(log => log.id),
              },
            },
          });
        }
      }
    });
  }

  /**
   * Apply a batch of edits with the campus-coin economy:
   * - placing a paid block costs 1 coin (rejected when the campus has none);
   * - breaking a previously placed paid block refunds 1 coin;
   * - free (world-construction) blocks are unaffected.
   *
   * Returns the edits that were actually applied, the positions rejected for
   * lack of coins, and the campus's new coin balance.
   */
  async applyEdits(
    campusId: string,
    blocks: WorldBlockDto[],
  ): Promise<{
    applied: WorldBlockDto[];
    rejected: { x: number; y: number; z: number }[];
    coins: number;
  }> {
    const world = await this.ensureWorld(campusId);
    const campus = await this.prisma.campus.findUnique({
      where: { id: campusId },
      select: { coins: true },
    });
    if (!campus) throw new NotFoundException('Campus not found');

    // Previous (persisted) block at each edited position; absent = base terrain.
    const existing = await this.prisma.worldBlock.findMany({
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
        // Breaking: refund only when a placed paid block is removed.
        const before = prev.get(key);
        if (before !== undefined && isPaidBlock(before)) coins += 1;
      }
      applied.push(b);
      prev.set(key, b.block);
    }

    await this.prisma.$transaction([
      ...applied.map((b) =>
        this.prisma.worldBlock.upsert({
          where: {
            worldId_x_y_z: { worldId: world.id, x: b.x, y: b.y, z: b.z },
          },
          create: {
            worldId: world.id,
            x: b.x,
            y: b.y,
            z: b.z,
            block: b.block,
            rotation: b.rotation ?? 0,
          },
          update: { block: b.block, rotation: b.rotation ?? 0 },
        }),
      ),
      this.prisma.campus.update({
        where: { id: campusId },
        data: { coins },
      }),
    ]);

    return { applied, rejected, coins };
  }

  /** The campus build budget (coins), or null if the campus does not exist. */
  async getCampusCoins(campusId: string): Promise<number | null> {
    const campus = await this.prisma.campus.findUnique({
      where: { id: campusId },
      select: { coins: true },
    });
    return campus?.coins ?? null;
  }

  /** Create a world (with a fresh random profile) for a campus that has none. */
  createWorld(campusId: string): Promise<World> {
    return this.prisma.world.create({
      data: { campusId, ...generateWorldProfile(campusId) },
    });
  }

  /** Return the campus world, creating it on the fly if it does not exist yet. */
  private async ensureWorld(campusId: string): Promise<World> {
    const world = await this.prisma.world.findUnique({ where: { campusId } });
    if (world) return world;

    const campus: Campus | null = await this.prisma.campus.findUnique({
      where: { id: campusId },
    });
    if (!campus) throw new NotFoundException('Campus not found');
    return this.createWorld(campusId);
  }
}
