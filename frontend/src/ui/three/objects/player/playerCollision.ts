import * as THREE from 'three'

import { Block } from '@/types/Block'
import { getGroundHeightAt } from './playerTerrain'
import { PLAYER_RADIUS } from './config'

export const checkCollisionAt = (params: {
  x: number
  z: number
  playerY: number
  heightMap: Uint16Array
  mapSize: number
  cameraPos: THREE.Vector3
  heightOffset: number
  placedBlocks?: Record<string, Block>
}) => {
  const halfSize = params.mapSize / 2
  const points = [
    { x: params.x + PLAYER_RADIUS, z: params.z + PLAYER_RADIUS },
    { x: params.x + PLAYER_RADIUS, z: params.z - PLAYER_RADIUS },
    { x: params.x - PLAYER_RADIUS, z: params.z + PLAYER_RADIUS },
    { x: params.x - PLAYER_RADIUS, z: params.z - PLAYER_RADIUS },
  ]

  for (const p of points) {
    const mapX = Math.floor(p.x + halfSize)
    const mapZ = Math.floor(p.z + halfSize)

    // Base terrain height check
    const terrainHeight = getGroundHeightAt({
      heightMap: params.heightMap,
      mapSize: params.mapSize,
      worldPos: new THREE.Vector3(p.x, 0, p.z),
      cameraPos: params.cameraPos,
      heightOffset: params.heightOffset,
    })

    if (terrainHeight > params.playerY + 0.5) return true

    // Placed blocks collision check: check if any placed block intersects the player's vertical height
    if (params.placedBlocks) {
      const startY = Math.floor(params.playerY)
      const endY = Math.ceil(params.playerY + 1.8) // Player is ~2 blocks tall
      for (let y = startY; y < endY; y++) {
        const key = `${mapX},${y},${mapZ}`
        if (params.placedBlocks[key] !== undefined && params.placedBlocks[key] !== Block.Air) {
          return true
        }
      }
    }
  }

  return false
}
