import * as THREE from 'three'

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
}) => {
  const points = [
    { x: params.x + PLAYER_RADIUS, z: params.z + PLAYER_RADIUS },
    { x: params.x + PLAYER_RADIUS, z: params.z - PLAYER_RADIUS },
    { x: params.x - PLAYER_RADIUS, z: params.z + PLAYER_RADIUS },
    { x: params.x - PLAYER_RADIUS, z: params.z - PLAYER_RADIUS },
  ]

  for (const p of points) {
    const groundHeight = getGroundHeightAt({
      heightMap: params.heightMap,
      mapSize: params.mapSize,
      worldPos: new THREE.Vector3(p.x, 0, p.z),
      cameraPos: params.cameraPos,
      heightOffset: params.heightOffset,
    })

    if (groundHeight > params.playerY + 0.5) return true
  }

  return false
}
