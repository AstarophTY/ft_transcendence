import { Block } from '@/types/Block'

export enum BiomeType {
  Desert = 'desert',
  Plains = 'plains',
  Forest = 'forest',
  Mountain = 'mountain'
}

export interface BiomeParameters {
  baseHeight: number
  variationRange: number
  scale: number
  octaves: number
  persistence: number
  relief: number
}

export const BIOME_CONFIGS: Record<BiomeType, BiomeParameters> = {
  [BiomeType.Desert]: {
    baseHeight: 8,
    variationRange: 4,
    scale: 0.015,
    octaves: 3,
    persistence: 0.35,
    relief: 0.4
  },
  [BiomeType.Plains]: {
    baseHeight: 12,
    variationRange: 3,
    scale: 0.01,
    octaves: 2,
    persistence: 0.3,
    relief: 0.5
  },
  [BiomeType.Forest]: {
    baseHeight: 14,
    variationRange: 6,
    scale: 0.02,
    octaves: 3,
    persistence: 0.4,
    relief: 0.6
  },
  [BiomeType.Mountain]: {
    baseHeight: 22,
    variationRange: 16,
    scale: 0.025,
    octaves: 4,
    persistence: 0.55,
    relief: 0.75
  }
}

/**
 * Determines which block to place at a given coordinate inside a biome.
 */
export const getBiomeBlock = (biome: BiomeType, y: number, height: number): Block => {
  // If we are high up (significant relief), make the entire column rocky with a gravel peak, regardless of the noise-selected biome
  if (height >= 18) {
    if (y === height) {
      return Block.Gravel
    }
    return Block.Stone
  }

  // Mountain biome always behaves as rocky with gravel topping
  if (biome === BiomeType.Mountain) {
    if (y === height) {
      return Block.Gravel
    }
    return Block.Stone
  }

  // Otherwise, use the standard biome block sets
  if (y === height) {
    switch (biome) {
      case BiomeType.Desert:
        return Block.Sand
      case BiomeType.Plains:
      case BiomeType.Forest:
        return Block.Grass
    }
  }

  if (y >= height - 3) {
    switch (biome) {
      case BiomeType.Desert:
        return Block.Sand
      case BiomeType.Plains:
      case BiomeType.Forest:
        return Block.Dirt
    }
  }

  // Deep layers
  switch (biome) {
    case BiomeType.Desert:
      if (y >= height - 6) {
        return Block.Sandstone
      }
      return Block.Stone
    default:
      return Block.Stone
  }
}
