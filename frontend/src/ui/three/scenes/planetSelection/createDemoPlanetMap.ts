import { Block } from '@/types/Block'
import { Chunk } from '@/types/maps/Chunk.ts'
import { LocalMap } from '@/types/maps/LocalMap.ts'
import { PlanetMap } from '@/types/maps/PlanetMap.ts'
import { IslandMap } from '@/perlin/terrain/IslandMap'

import type { DemoPlanetProfile } from '@/types/Three'

export const createDemoPlanetMap = (profile: DemoPlanetProfile) => {
  const continent = new LocalMap(profile.widthInChunks, profile.depthInChunks)
  const islandMap = new IslandMap({
    seed: profile.seed,
    mapSize: Math.max(profile.widthInChunks, profile.depthInChunks) * Chunk.WIDTH,
    maxHeight: Chunk.HEIGHT - 1,
    scale: profile.scale,
    octaves: profile.octaves,
    persistence: profile.persistence,
    relief: profile.relief,
    baseHeight: profile.baseHeight,
    variationRange: profile.variationRange,
  })

  const waterHeight = 15

  for (let chunkX = 0; chunkX < continent.widthInChunks; chunkX += 1) {
    for (let chunkZ = 0; chunkZ < continent.depthInChunks; chunkZ += 1) {
      const chunk = new Chunk()

      for (let x = 0; x < Chunk.WIDTH; x += 1) {
        for (let z = 0; z < Chunk.WIDTH; z += 1) {
          const worldX = chunkX * Chunk.WIDTH + x
          const worldZ = chunkZ * Chunk.WIDTH + z
          const height = islandMap.getHeightAt(worldX, worldZ)

          // Same block layering as the real world, so the preview colors match:
          // sand near/below water, grass on top, dirt then stone underneath.
          for (let y = 1; y <= height; y += 1) {
            if (height < waterHeight) {
              chunk.setBlock(x, y, z, y >= height - 2 ? Block.Sand : Block.Stone)
            } else if (y === height) {
              chunk.setBlock(x, y, z, Block.Grass)
            } else if (y >= height - 3) {
              chunk.setBlock(x, y, z, Block.Dirt)
            } else {
              chunk.setBlock(x, y, z, Block.Stone)
            }
          }

          // Fill the low areas with water up to the water line.
          if (height < waterHeight) {
            for (let y = height + 1; y <= waterHeight; y += 1) {
              chunk.setBlock(x, y, z, Block.Water)
            }
          }
        }
      }

      continent.setChunk(chunkX, chunkZ, chunk)
    }
  }

  return new PlanetMap(continent)
}
