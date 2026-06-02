import { useMemo } from 'react'

import { Chunk } from '@/models/maps/Chunk.ts'
import { IslandMap } from '@/perlin/terrain/IslandMap'

import type { DemoPlanetProfile } from '../planetSelection/demoPlanetProfiles'

export const useHeightMap = (profile: DemoPlanetProfile, mapSize: number) => {
  return useMemo(() => {
    const islandMap = new IslandMap({
      seed: profile.seed,
      mapSize,
      maxHeight: Chunk.HEIGHT - 1,
      scale: profile.scale,
      octaves: profile.octaves,
      persistence: profile.persistence,
      relief: profile.relief,
      baseHeight: profile.baseHeight,
      variationRange: profile.variationRange,
    })

    const data = new Uint16Array(mapSize * mapSize)
    let index = 0

    for (let z = 0; z < mapSize; z += 1) {
      for (let x = 0; x < mapSize; x += 1) {
        data[index] = islandMap.getHeightAt(x, z)
        index += 1
      }
    }

    return data
  }, [profile, mapSize])
}
