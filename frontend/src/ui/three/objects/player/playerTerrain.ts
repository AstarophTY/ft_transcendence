import * as THREE from 'three'

import { Block } from '@/types/Block'
import { getCurvatureOffset } from '@/ui/three/utils/curvature'

export const getMapIndexFromWorld = (x: number, z: number, mapSize: number, halfSize: number) => {
  const mapX = Math.floor(x + halfSize)
  const mapZ = Math.floor(z + halfSize)
  const clampedX = THREE.MathUtils.clamp(mapX, 0, mapSize - 1)
  const clampedZ = THREE.MathUtils.clamp(mapZ, 0, mapSize - 1)
  return clampedZ * mapSize + clampedX
}

export const getGroundHeightAt = (params: {
  heightMap: Uint16Array
  mapSize: number
  worldPos: THREE.Vector3
  cameraPos: THREE.Vector3
  heightOffset: number
  placedBlocks?: Record<string, Block>
}) => {
  const halfSize = params.mapSize / 2
  const mapIndex = getMapIndexFromWorld(params.worldPos.x, params.worldPos.z, params.mapSize, halfSize)
  const rawGroundHeight = params.heightMap[mapIndex] ?? 0
  let highestGround = rawGroundHeight

  if (params.placedBlocks) {
    const mapX = Math.floor(params.worldPos.x + halfSize)
    const mapZ = Math.floor(params.worldPos.z + halfSize)
    
    // Find the highest placed block below the player's current Y position
    for (let blockY = 0; blockY < 64; blockY++) {
      const key = `${mapX},${blockY},${mapZ}`
      if (params.placedBlocks[key] !== undefined && params.placedBlocks[key] !== Block.Air) {
        // Compare with the top of the block (blockY + 1)
        if (blockY + 1 <= params.worldPos.y + 0.1) {
          highestGround = Math.max(highestGround, blockY)
        }
      }
    }
  }

  const curvatureOffset = getCurvatureOffset(params.worldPos, params.cameraPos)
  return highestGround + params.heightOffset - curvatureOffset
}
