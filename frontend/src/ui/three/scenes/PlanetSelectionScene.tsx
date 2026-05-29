import { useMemo } from 'react'

import { Block } from '../../../models/Block.ts'
import { Chunk } from '../../../models/maps/Chunk.ts'
import { LocalMap } from '../../../models/maps/LocalMap.ts'
import { PlanetMap } from '../../../models/maps/PlanetMap.ts'
import SelectablePlanet from '../objects/SelectablePlanet.tsx'

const createDemoPlanetMap = () => {
  const continent = new LocalMap(4, 4)

  for (let chunkX = 0; chunkX < continent.widthInChunks; chunkX += 1) {
    for (let chunkZ = 0; chunkZ < continent.depthInChunks; chunkZ += 1) {
      const chunk = new Chunk()

      for (let x = 0; x < Chunk.WIDTH; x += 1) {
        for (let z = 0; z < Chunk.WIDTH; z += 1) {
          const worldX = chunkX * Chunk.WIDTH + x
          const worldZ = chunkZ * Chunk.WIDTH + z
          const distance = Math.hypot(worldX - 31.5, worldZ - 31.5)
          const height = Math.max(0, Math.floor(14 - distance / 3))

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

const PlanetSelectionScene = () => {
  const planetMap = useMemo(() => createDemoPlanetMap(), [])

  return <SelectablePlanet map={planetMap} />
}

export default PlanetSelectionScene
