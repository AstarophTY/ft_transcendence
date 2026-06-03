
import { Block } from '@/types/Block'
import { PLAYER_RADIUS } from './config'
import { LocalMap } from '@/types/maps/LocalMap'
import { Chunk } from '@/types/maps/Chunk'

export const checkCollisionAt = (params: {
  x: number
  z: number
  playerY: number
  localMap: LocalMap
}) => {
  const mapSizeBlocks = params.localMap.widthInChunks * Chunk.WIDTH
  const halfSize = mapSizeBlocks / 2

  const points = [
    { x: params.x + PLAYER_RADIUS, z: params.z + PLAYER_RADIUS },
    { x: params.x + PLAYER_RADIUS, z: params.z - PLAYER_RADIUS },
    { x: params.x - PLAYER_RADIUS, z: params.z + PLAYER_RADIUS },
    { x: params.x - PLAYER_RADIUS, z: params.z - PLAYER_RADIUS },
  ]

  for (const p of points) {
    const globalX = Math.floor(p.x + halfSize)
    const globalZ = Math.floor(p.z + halfSize)

    // Check if any solid block intersects the player's height bounds
    const startY = Math.max(0, Math.floor(params.playerY))
    const endY = Math.min(Chunk.HEIGHT - 1, Math.ceil(params.playerY + 1.8)) // Player is ~2 blocks tall

    for (let y = startY; y < endY; y++) {
      const block = params.localMap.getGlobalBlock(globalX, y, globalZ)
      if (block !== Block.Air && block !== Block.Water) {
        return true
      }
    }
  }

  return false
}
