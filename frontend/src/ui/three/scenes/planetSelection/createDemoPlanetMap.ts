import { Block } from '@/types/Block'
import { Chunk } from '@/types/maps/Chunk.ts'
import { PlanetMap } from '@/types/maps/PlanetMap.ts'
import { IslandMap, getBiomeBlock } from '@/perlin'

import type { DemoPlanetProfile } from '@/types/Three'

import { CHUNKS_PER_SIDE } from '../worldScene/constants.ts'
import type { PreviewVoxel } from '@/types/maps/PreviewVoxel.ts'
import { BlockMetadata } from '@/config/Block'

const BLOCK_COLORS = BlockMetadata as Record<number, { color: string }>

export const createDemoPlanetMap = (profile: DemoPlanetProfile) => {
  const mapSize = CHUNKS_PER_SIDE * Chunk.WIDTH
  const islandMap = new IslandMap({
    seed: profile.seed,
    mapSize: mapSize,
    maxHeight: Chunk.HEIGHT - 1,
    scale: profile.scale,
    octaves: profile.octaves,
    persistence: profile.persistence,
    relief: profile.relief,
    baseHeight: profile.baseHeight,
    variationRange: profile.variationRange,
    applyConstraints: true,
  })

  // Build a lookup map of user edits to overlay on the procedural surface
  const editsMap = new Map<string, Block>()
  if (profile.blocks) {
    for (const b of profile.blocks) {
      if (
        b.x >= 0 && b.x < mapSize &&
        b.y >= 0 && b.y < Chunk.HEIGHT &&
        b.z >= 0 && b.z < mapSize
      ) {
        editsMap.set(`${b.x},${b.y},${b.z}`, b.block)
      }
    }
  }

  // We return a proxy object that implements `getPreview` so we don't
  // have to generate a heavy 512x512 LocalMap just for a 32x32 miniature.
  return {
    getPreview: (resolution: number = 32): PreviewVoxel[] => {
      const previewData: PreviewVoxel[] = []
      const stepX = mapSize / resolution
      const stepZ = mapSize / resolution

      if (stepX === 0 || stepZ === 0) return []
      const MAX_HEIGHT = Chunk.HEIGHT - 1

      for (let px = 0; px < resolution; px++) {
        for (let pz = 0; pz < resolution; pz++) {
          const startX = Math.floor(px * stepX)
          const startZ = Math.floor(pz * stepZ)
          let endX = Math.floor((px + 1) * stepX)
          let endZ = Math.floor((pz + 1) * stepZ)

          if (endX <= startX) endX = Math.min(startX + 1, mapSize)
          if (endZ <= startZ) endZ = Math.min(startZ + 1, mapSize)

          let heightSum = 0
          let surfaceCount = 0
          const blockCounts = new Map<Block, number>()

          for (let realX = startX; realX < endX; realX++) {
            for (let realZ = startZ; realZ < endZ; realZ++) {
              // The procedural surface altitude
              const baseHeight = islandMap.getHeightAt(realX, realZ)
              const biome = islandMap.getBiomeAt(realX, realZ)

              // We emulate a downward raycast combining user edits and procedural terrain
              for (let y = MAX_HEIGHT; y >= 0; y--) {
                const key = `${realX},${y},${realZ}`
                let block = Block.Air

                if (editsMap.has(key)) {
                  block = editsMap.get(key)!
                } else if (y <= baseHeight) {
                  block = y === 0 ? Block.Bedrock : getBiomeBlock(biome, y, baseHeight)
                }

                if (block !== Block.Air) {
                  heightSum += y
                  surfaceCount++
                  blockCounts.set(block, (blockCounts.get(block) ?? 0) + 1)
                  break
                }
              }
            }
          }

          if (surfaceCount > 0) {
            let surfaceBlock = Block.Air
            let best = 0
            for (const [block, count] of blockCounts) {
              if (count > best) {
                best = count
                surfaceBlock = block
              }
            }

            const averagedY = heightSum / surfaceCount
            // We exaggerate the vertical relief for the miniature so it doesn't look flat
            // (since the real map is 512 wide but only ~40 high, it would look like a pancake).
            const smoothedY = averagedY / 2.5

            previewData.push({
              x: px,
              y: smoothedY,
              z: pz,
              block: surfaceBlock,
              // Use the exact color of the dominant block rather than a muddy average
              color: BLOCK_COLORS[surfaceBlock]?.color ?? '#808080',
            })
          }
        }
      }

      return previewData
    },
  } as unknown as PlanetMap
}
