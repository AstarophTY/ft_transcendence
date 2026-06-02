import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

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

  // Load the grass block model
  const { nodes } = useGLTF('/three/assets/blocks/dirt_with_grass.gltf')
  
  const grassMesh = useMemo(() => {
    return Object.values(nodes).find((node) => (node as THREE.Mesh).isMesh) as THREE.Mesh | undefined
  }, [nodes])

  const material = useMemo(() => {
    if (!grassMesh) return null
    if (Array.isArray(grassMesh.material)) {
      return grassMesh.material.map((m) => {
        const cloneMat = m.clone()
        cloneMat.onBeforeCompile = onBeforeCompile
        return cloneMat
      })
    } else {
      const cloneMat = grassMesh.material.clone()
      cloneMat.onBeforeCompile = onBeforeCompile
      return cloneMat
    }
  }, [grassMesh, onBeforeCompile])

  useEffect(() => {
    if (!meshRef.current || !grassMesh) return

    const tempMatrix = new THREE.Matrix4()
    const halfSize = mapSize / 2
    let instanceIndex = 0
    const scaleVector = new THREE.Vector3(0.5, 0.5, 0.5)

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
        tempMatrix.scale(scaleVector)

        meshRef.current.setMatrixAt(instanceIndex, tempMatrix)
        instanceIndex++
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.computeBoundingSphere()
    meshRef.current.computeBoundingBox()
  }, [chunkX, chunkZ, heightMap, mapSize, grassMesh])

  useFrame(() => {
    if (meshRef.current && material) {
      updateCurvatureUniforms(material, camera)
    }
  })

  if (!grassMesh || !material) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[grassMesh.geometry, material, Chunk.WIDTH * Chunk.WIDTH]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  )
}

useGLTF.preload('/three/assets/blocks/dirt_with_grass.gltf')
