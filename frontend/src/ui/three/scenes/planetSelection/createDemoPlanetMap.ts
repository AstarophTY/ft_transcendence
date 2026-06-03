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

  for (let chunkX = 0; chunkX < continent.widthInChunks; chunkX += 1) {
    for (let chunkZ = 0; chunkZ < continent.depthInChunks; chunkZ += 1) {
      const chunk = new Chunk()

      for (let x = 0; x < Chunk.WIDTH; x += 1) {
        for (let z = 0; z < Chunk.WIDTH; z += 1) {
          const worldX = chunkX * Chunk.WIDTH + x
          const worldZ = chunkZ * Chunk.WIDTH + z
          const height = islandMap.getHeightAt(worldX, worldZ)

          for (let y = 0; y <= height; y += 1) {
            chunk.setBlock(x, y, z, Block.Stone)
          }
        }
      }

      continent.setChunk(chunkX, chunkZ, chunk)
    }
  }

  return new PlanetMap(continent)
}
