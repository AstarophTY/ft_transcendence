import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { Chunk } from '@/types/maps/Chunk.ts'
import { updateCurvatureUniforms } from '../../utils/curvature'

interface ChunkRendererProps {
  chunkX: number
  chunkZ: number
  heightMap: Uint16Array
  mapSize: number
  onBeforeCompile: (shader: THREE.WebGLProgramParametersWithUniforms) => void
  curvature: number
  camera: THREE.Camera
}

export const ChunkRenderer = ({
  chunkX,
  chunkZ,
  heightMap,
  mapSize,
  onBeforeCompile,
  camera,
}: ChunkRendererProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    if (!meshRef.current) return

    const tempMatrix = new THREE.Matrix4()
    const halfSize = mapSize / 2
    let instanceIndex = 0

    for (let lz = 0; lz < Chunk.WIDTH; lz++) {
      for (let lx = 0; lx < Chunk.WIDTH; lx++) {
        const x = chunkX * Chunk.WIDTH + lx
        const z = chunkZ * Chunk.WIDTH + lz
        const mapIndex = z * mapSize + x
        const height = heightMap[mapIndex] ?? 0

        tempMatrix.makeTranslation(
          x - halfSize + 0.5,
          height + 0.5,
          z - halfSize + 0.5
        )
        meshRef.current.setMatrixAt(instanceIndex, tempMatrix)
        instanceIndex++
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.computeBoundingSphere()
    meshRef.current.computeBoundingBox()
  }, [chunkX, chunkZ, heightMap, mapSize])

  useFrame(() => {
    if (meshRef.current) {
      updateCurvatureUniforms(meshRef.current.material, camera)
    }
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, Chunk.WIDTH * Chunk.WIDTH]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#FFFFFF" onBeforeCompile={onBeforeCompile} />
    </instancedMesh>
  )
}
