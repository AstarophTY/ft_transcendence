import { Block } from '@/types/block.ts'
import {BiomeType} from "@/types/biome.ts";

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
