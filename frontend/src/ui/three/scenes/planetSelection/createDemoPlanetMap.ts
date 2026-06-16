import { Block } from '@/types/Block'
import { Chunk } from '@/types/maps/Chunk.ts'
import { PlanetMap } from '@/types/maps/PlanetMap.ts'
import { IslandMap, getBiomeBlock } from '@/generation'

import type { DemoPlanetProfile } from '@/types/Three'

import { CHUNKS_PER_SIDE } from '../worldScene/constants.ts'
import type { PreviewVoxel } from '@/types/maps/PreviewVoxel.ts'
import { BlockMetadata } from '@/config/Block'
import { BiomeType } from '@/generation'

const BLOCK_COLORS = BlockMetadata as Record<number, { color: string }>

const hexToRgb = (hex: string): [number, number, number] => {
  const value = parseInt(hex.replace('#', ''), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const rgbToHex = (r: number, g: number, b: number): string =>
  '#' +
  [r, g, b]
    .map((n) => Math.round(n).toString(16).padStart(2, '0'))
    .join('')

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
  const midX = Math.floor(CHUNKS_PER_SIDE / 2)
  const midZ = Math.floor(CHUNKS_PER_SIDE / 2)
  const chunkSize = Chunk.WIDTH
  const minX = (midX - 2) * chunkSize
  const maxX = (midX + 2) * chunkSize
  const minZ = (midZ - 2) * chunkSize
  const maxZ = (midZ + 2) * chunkSize

  if (profile.blocks) {
    for (const b of profile.blocks) {
      let targetY = b.y
      if (b.x >= minX && b.x < maxX && b.z >= minZ && b.z < maxZ) {
        targetY = b.y + 7
      }

      if (
        b.x >= 0 && b.x < mapSize &&
        targetY >= 0 && targetY < Chunk.HEIGHT &&
        b.z >= 0 && b.z < mapSize
      ) {
        editsMap.set(`${b.x},${targetY},${b.z}`, b.block)
      }
    }
  }

  return {
    getPreview: (resolution: number = 32): PreviewVoxel[] => {
      const previewData: PreviewVoxel[] = []

      // The map has a 64-block flat border on all sides. We crop it out for the preview
      // so the terrain extends all the way to the edges of the 3D cube faces.
      const BORDER_SIZE = 64
      const usableSize = mapSize - BORDER_SIZE * 2
      const stepX = usableSize / resolution
      const stepZ = usableSize / resolution

      if (stepX === 0 || stepZ === 0) return []
      const MAX_HEIGHT = Chunk.HEIGHT - 1

      for (let px = 0; px < resolution; px++) {
        for (let pz = 0; pz < resolution; pz++) {
          const startX = BORDER_SIZE + Math.floor(px * stepX)
          const startZ = BORDER_SIZE + Math.floor(pz * stepZ)
          let endX = BORDER_SIZE + Math.floor((px + 1) * stepX)
          let endZ = BORDER_SIZE + Math.floor((pz + 1) * stepZ)

          if (endX <= startX) endX = Math.min(startX + 1, mapSize - BORDER_SIZE)
          if (endZ <= startZ) endZ = Math.min(startZ + 1, mapSize - BORDER_SIZE)

          let heightSum = 0
          let surfaceCount = 0
          let rSum = 0, gSum = 0, bSum = 0
          const blockCounts = new Map<Block, number>()

          for (let realX = startX; realX < endX; realX++) {
            for (let realZ = startZ; realZ < endZ; realZ++) {
              // The procedural surface altitude
              const baseHeight = islandMap.getHeightAt(realX, realZ)
              const biome = islandMap.getBiomeAt(realX, realZ)

              // Emulate tree canopy scattering in the forest biome for preview texture
              let hasLeaves = false
              if (biome === BiomeType.Forest) {
                const hash = (Math.abs(Math.sin(realX * 12.9898 + realZ * 78.233) * 43758.5453) % 1)
                // ~45% canopy coverage creates a nice dense textured look
                if (hash < 0.45) hasLeaves = true
              }

              // We emulate a downward raycast combining user edits and procedural terrain
              for (let y = MAX_HEIGHT; y >= 0; y--) {
                const key = `${realX},${y},${realZ}`
                let block = Block.Air

                if (editsMap.has(key)) {
                  block = editsMap.get(key)!
                } else if (hasLeaves && y === baseHeight + 3) {
                  block = Block.Leaves
                } else if (y <= baseHeight) {
                  block = y === 0 ? Block.Bedrock : getBiomeBlock(biome, y, baseHeight)
                }

                if (block !== Block.Air) {
                  heightSum += y
                  surfaceCount++
                  blockCounts.set(block, (blockCounts.get(block) ?? 0) + 1)

                  const hex = BLOCK_COLORS[block]?.color ?? '#808080'
                  const [r, g, b] = hexToRgb(hex)
                  rSum += r; gSum += g; bSum += b
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
            const smoothedY = averagedY

            previewData.push({
              x: px,
              y: smoothedY,
              z: pz,
              block: surfaceBlock,
              color: rgbToHex(rSum / surfaceCount, gSum / surfaceCount, bSum / surfaceCount),
            })
          }
        }
      }

      return previewData
    },
  } as unknown as PlanetMap
}
