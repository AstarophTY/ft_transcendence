import {BiomeParameters, BiomeType} from "@/types/biome.ts";

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