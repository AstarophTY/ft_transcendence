import { IslandMap } from "@/generation/terrain/islandMap.ts";
import {getBiomeBlock } from "@/generation/terrain/biome.ts";

export { IslandMap, getBiomeBlock };
export type { MapConfig } from "@/types/maps/mapConfig.ts";
export { Perlin2D } from "@/generation/noise/perlin2D.ts";