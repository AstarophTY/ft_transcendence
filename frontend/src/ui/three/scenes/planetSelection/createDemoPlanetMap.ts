import { Block } from '@/types/Block'
import { Chunk } from '@/types/maps/Chunk.ts'
import { LocalMap } from '@/types/maps/LocalMap.ts'
import { PlanetMap } from '@/types/maps/PlanetMap.ts'
import { IslandMap, BiomeType, getBiomeBlock } from '@/perlin'

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

      // Pass 1: Set blocks based on biome mapping
      for (let x = 0; x < Chunk.WIDTH; x += 1) {
        for (let z = 0; z < Chunk.WIDTH; z += 1) {
          const worldX = chunkX * Chunk.WIDTH + x
          const worldZ = chunkZ * Chunk.WIDTH + z
          const height = islandMap.getHeightAt(worldX, worldZ)
          const biome = islandMap.getBiomeAt(worldX, worldZ)

          for (let y = 0; y <= height; y += 1) {
            if (y === 0) {
              chunk.setBlock(x, y, z, Block.Bedrock)
            } else {
              chunk.setBlock(x, y, z, getBiomeBlock(biome, y, height))
            }
          }
        }
      }

      // Pass 2: Spawn trees in Forest biome for preview details
      for (let x = 2; x < Chunk.WIDTH - 2; x += 1) {
        for (let z = 2; z < Chunk.WIDTH - 2; z += 1) {
          const worldX = chunkX * Chunk.WIDTH + x
          const worldZ = chunkZ * Chunk.WIDTH + z
          const height = islandMap.getHeightAt(worldX, worldZ)
          const biome = islandMap.getBiomeAt(worldX, worldZ)

          if (biome === BiomeType.Forest) {
            const hash = (Math.abs(Math.sin(worldX * 12.9898 + worldZ * 78.233) * 43758.5453) % 1)
            if (hash < 0.02) {
              const treeHeight = 3 + Math.floor(hash * 100) % 2
              for (let ty = 1; ty <= treeHeight; ty++) {
                chunk.setBlock(x, height + ty, z, Block.Wood)
              }
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  for (let dz = -1; dz <= 1; dz++) {
                    const ly = height + treeHeight + dy
                    if (ly < 1 || ly >= Chunk.HEIGHT) continue
                    if (chunk.getBlock(x + dx, ly, z + dz) === Block.Air) {
                      chunk.setBlock(x + dx, ly, z + dz, Block.Leaves)
                    }
                  }
                }
              }
            }
          }
        }
      }

      continent.setChunk(chunkX, chunkZ, chunk)
    }
  }

  return new PlanetMap(continent)
}
