import { Injectable, NotFoundException } from '@nestjs/common';
import { Campus, World } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorldBlockDto } from './dto/save-blocks.dto';
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
      select: { x: true, y: true, z: true, block: true, rotation: true },
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

  /**
   * Persist a batch of block edits. A block set back to its generated state is
   * still stored as a diff entry; broken blocks are stored as Air (0).
   */
  async saveBlocks(campusId: string, blocks: WorldBlockDto[], userId: string): Promise<void> {
    if (blocks.length === 0) return;
    const world = await this.ensureWorld(campusId);
    await this.prisma.$transaction(
      blocks.map((b) => {
        const rotation = b.rotation ?? 0;
        return this.prisma.worldBlock.upsert({
          where: {
            worldId_x_y_z: { worldId: world.id, x: b.x, y: b.y, z: b.z },
          },
          create: {
            worldId: world.id,
            x: b.x,
            y: b.y,
            z: b.z,
            userIds: [userId],
            block: b.block,
            rotation,
          },
          update: { block: b.block, rotation // TODO },
        });
      }),
    );
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
