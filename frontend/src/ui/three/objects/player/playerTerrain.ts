import * as THREE from 'three'

import { Block } from '@/types/Block'
import { LocalMap } from '@/types/maps/LocalMap'
import { Chunk } from '@/types/maps/Chunk'

export const getGroundHeightAt = (params: {
  localMap: LocalMap
  worldPos: THREE.Vector3
  cameraPos: THREE.Vector3
  heightOffset: number
}) => {
  const mapSizeBlocks = params.localMap.widthInChunks * Chunk.WIDTH
  const halfSize = mapSizeBlocks / 2
  const globalX = Math.floor(params.worldPos.x + halfSize)
  const globalZ = Math.floor(params.worldPos.z + halfSize)

  // Starting from the player's current Y floor coordinate down to 0, find the highest solid block
  let highestGround = 0
  const startY = Math.min(Chunk.HEIGHT - 1, Math.max(0, Math.floor(params.worldPos.y + 0.1)))

  for (let y = startY; y >= 0; y--) {
    const block = params.localMap.getGlobalBlock(globalX, y, globalZ)
    if (block !== Block.Air && block !== Block.Water) {
      highestGround = y
      break
    }
  }

  return highestGround + params.heightOffset
}
