import * as THREE from 'three'

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
}) => {
  const halfSize = params.mapSize / 2
  const mapIndex = getMapIndexFromWorld(params.worldPos.x, params.worldPos.z, params.mapSize, halfSize)
  const rawGroundHeight = params.heightMap[mapIndex] ?? 0
  const curvatureOffset = getCurvatureOffset(params.worldPos, params.cameraPos)
  return rawGroundHeight + params.heightOffset - curvatureOffset
}
