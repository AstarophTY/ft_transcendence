import { useRef, useMemo, useLayoutEffect } from 'react'
import * as THREE from 'three'

import { Chunk } from '@/types/maps/Chunk.ts'
import { Block } from '@/types/Block'
import { LocalMap } from '@/types/maps/LocalMap'

interface ChunkBlockTypeRendererProps {
  blockType: Exclude<Block, Block.Air>
  instances: { x: number; y: number; z: number }[]
  chunkX: number
  chunkZ: number
  mapSize: number
  geometry: THREE.BufferGeometry
  material: THREE.Material | THREE.Material[]
}

const ChunkBlockTypeRenderer = ({
  blockType,
  instances,
  chunkX,
  chunkZ,
  mapSize,
  geometry,
  material,
}: ChunkBlockTypeRendererProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const tempMatrix = new THREE.Matrix4()
    const halfSize = mapSize / 2
    // Scale slightly larger to eliminate render gaps, with an increased vertical Y scale (0.6) for stylized voxel columns
    const scaleVector = new THREE.Vector3(0.505, 0.6, 0.505)

    instances.forEach((inst, index) => {
      const x = chunkX * Chunk.WIDTH + inst.x
      const z = chunkZ * Chunk.WIDTH + inst.z
      const y = inst.y

      tempMatrix.makeTranslation(
        x - halfSize + 0.5,
        y + 0.5,
        z - halfSize + 0.5
      )
      tempMatrix.scale(scaleVector)

      mesh.setMatrixAt(index, tempMatrix)
    })

    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    mesh.computeBoundingBox()
  }, [instances, chunkX, chunkZ, mapSize])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, instances.length]}
      castShadow={blockType !== Block.Water}
      receiveShadow={blockType !== Block.Water}
    />
  )
}

interface ChunkRendererProps {
  chunkX: number
  chunkZ: number
  localMap: LocalMap
  blockAssets: Record<
    Exclude<Block, Block.Air>,
    { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] }
  >
  camera: THREE.Camera
}

// Optimized adjacency check: queries local chunk directly if neighbor coordinates lie inside the current chunk,
// bypassing expensive global coordinate and chunk map calculations for 90%+ of lookups.
const isBlockExposed = (
  lx: number,
  y: number,
  lz: number,
  chunk: Chunk,
  localMap: LocalMap,
  chunkX: number,
  chunkZ: number,
  currentBlock: Block
) => {
  const directions = [
    [0, 1, 0],   // top
    [0, -1, 0],  // bottom
    [1, 0, 0],   // +x
    [-1, 0, 0],  // -x
    [0, 0, 1],   // +z
    [0, 0, -1],  // -z
  ]

  for (const [dx, dy, dz] of directions) {
    const ny = y + dy
    if (ny < 0 || ny >= Chunk.HEIGHT) return true

    const nx = lx + dx
    const nz = lz + dz

    let neighborBlock: Block

    if (nx >= 0 && nx < Chunk.WIDTH && nz >= 0 && nz < Chunk.WIDTH) {
      // Local block check (extremely fast)
      neighborBlock = chunk.getBlock(nx, ny, nz)
    } else {
      // Global cross-chunk check
      const globalX = chunkX * Chunk.WIDTH + nx
      const globalZ = chunkZ * Chunk.WIDTH + nz
      neighborBlock = localMap.getGlobalBlock(globalX, ny, globalZ)
    }

    if (currentBlock === Block.Water) {
      if (neighborBlock === Block.Air || neighborBlock === Block.Glass) {
        return true
      }
    } else {
      if (neighborBlock === Block.Air || neighborBlock === Block.Water || neighborBlock === Block.Glass) {
        return true
      }
    }
  }

  return false
}

export const ChunkRenderer = ({
  chunkX,
  chunkZ,
  localMap,
  blockAssets,
}: ChunkRendererProps) => {
  const chunk = localMap.getChunk(chunkX, chunkZ)

  // Optimize: use chunk.version dependency to only recalculate instances if this chunk was modified!
  const instancesByBlock = useMemo(() => {
    const lists: Record<Exclude<Block, Block.Air>, { x: number; y: number; z: number }[]> = {} as any
    const activeBlocks = Object.values(Block).filter(
      (b) => typeof b === 'number' && b !== Block.Air
    ) as Exclude<Block, Block.Air>[]

    activeBlocks.forEach((b) => {
      lists[b] = []
    })

    if (!chunk) return lists

    for (let y = 0; y < Chunk.HEIGHT; y++) {
      for (let lz = 0; lz < Chunk.WIDTH; lz++) {
        for (let lx = 0; lx < Chunk.WIDTH; lx++) {
          const block = chunk.getBlock(lx, y, lz)
          if (block !== Block.Air) {
            if (isBlockExposed(lx, y, lz, chunk, localMap, chunkX, chunkZ, block)) {
              lists[block].push({ x: lx, y, z: lz })
            }
          }
        }
      }
    }

    return lists
  }, [chunk, localMap, chunkX, chunkZ, chunk?.version])

  if (!chunk) return null

  const mapSize = localMap.widthInChunks * Chunk.WIDTH

  return (
    <group>
      {Object.entries(instancesByBlock).map(([blockStr, instances]) => {
        const blockType = Number(blockStr) as Exclude<Block, Block.Air>
        if (instances.length === 0) return null

        const asset = blockAssets[blockType]
        if (!asset) return null

        return (
          <ChunkBlockTypeRenderer
            key={blockType}
            blockType={blockType}
            instances={instances}
            chunkX={chunkX}
            chunkZ={chunkZ}
            mapSize={mapSize}
            geometry={asset.geometry}
            material={asset.material}
          />
        )
      })}
    </group>
  )
}
