import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import { useHotkeys } from 'react-hotkeys-hook'

import { Chunk } from '@/types/maps/Chunk.ts'
import { usePlanetStore } from '@/store/planetStore.ts'
import { useEditorStore } from '@/store/editorStore'
import Player from '../objects/Player'
import { applyCurvature, CURVATURE_INTENSITY, updateCurvatureUniforms } from '../utils/curvature'
import { DEMO_PLANET_PROFILES } from './planetSelection/demoPlanetProfiles'
import { ChunkRenderer } from './worldScene/ChunkRenderer'
import { CHUNKS_PER_SIDE, MAP_SIZE_BLOCKS, RENDER_DISTANCE_CHUNKS } from './worldScene/constants'
import { FreeCameraControls } from './worldScene/FreeCameraControls'
import { useHeightMap } from './worldScene/useHeightMap'
import { Block } from '@/types/Block'
import { BlockMetadata } from '@/config/Block'

const WorldScene = () => {
  const activeIndex = usePlanetStore((state) => state.activeIndex)
  const playerRef = useRef<THREE.Group>(null)

  // Use state for mode to trigger re-renders
  const [currentMode, setCurrentMode] = useState<'freecam' | 'player'>('player')
  const activeEditor = useEditorStore((state) => state.activeEditor)

  useHotkeys('c', () => {
    setCurrentMode((prev) => {
      const nextMode = prev === 'freecam' ? 'player' : 'freecam'
      activeEditor(nextMode === 'freecam')
      return nextMode
    })
  })


  const profile = useMemo(() => {
    const safeIndex = Math.min(Math.max(activeIndex, 0), DEMO_PLANET_PROFILES.length - 1)
    return DEMO_PLANET_PROFILES[safeIndex]!
  }, [activeIndex])

  const initialHeightMap = useHeightMap(profile, MAP_SIZE_BLOCKS)
  const [heightMap, setHeightMap] = useState<Uint16Array>(initialHeightMap)
  const [placedBlocks, setPlacedBlocks] = useState<Record<string, Block>>({})
  const placedBlocksGroupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    setHeightMap(initialHeightMap)
  }, [initialHeightMap])

  const handleUpdatePlacedBlock = (x: number, y: number, z: number, block: Block | null) => {
    setPlacedBlocks((prev) => {
      const next = { ...prev }
      const key = `${x},${y},${z}`
      if (block === null || block === Block.Air) {
        delete next[key]
      } else {
        next[key] = block
      }
      return next
    })
  }

  const { camera } = useThree()

  // Curvature effect
  const onBeforeCompile = useMemo(
    () =>
      function (this: THREE.Material, shader: THREE.WebGLProgramParametersWithUniforms) {
        applyCurvature(shader, this)
      },
    []
  )

  const [visibleChunks, setVisibleChunks] = useState<{ cx: number; cz: number }[]>([])

  useFrame(() => {
    const cameraChunkX = Math.floor((camera.position.x + MAP_SIZE_BLOCKS / 2) / Chunk.WIDTH)
    const cameraChunkZ = Math.floor((camera.position.z + MAP_SIZE_BLOCKS / 2) / Chunk.WIDTH)

    const newVisibleChunks = []
    for (let cz = 0; cz < CHUNKS_PER_SIDE; cz++) {
      for (let cx = 0; cx < CHUNKS_PER_SIDE; cx++) {
        const dx = cx - cameraChunkX
        const dz = cz - cameraChunkZ
        const distSq = dx * dx + dz * dz
        if (distSq <= RENDER_DISTANCE_CHUNKS * RENDER_DISTANCE_CHUNKS) {
          newVisibleChunks.push({ cx, cz })
        }
      }
    }

    // Only update state if the set of visible chunks changed to avoid unnecessary re-renders
    const visibleKeys = newVisibleChunks.map((c) => `${c.cx}-${c.cz}`).join(',')
    const currentKeys = visibleChunks.map((c) => `${c.cx}-${c.cz}`).join(',')

    if (visibleKeys !== currentKeys) {
      setVisibleChunks(newVisibleChunks)
    }

    // Curvature effect for player-placed blocks
    if (placedBlocksGroupRef.current) {
      placedBlocksGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.name === 'placed-block') {
          updateCurvatureUniforms((child as THREE.Mesh).material, camera)
        }
      })
    }
  })

  return (
    <group>
      <FreeCameraControls
        heightMap={heightMap}
        mapSize={MAP_SIZE_BLOCKS}
        active={currentMode === 'freecam'}
        playerRef={playerRef}
        placedBlocks={placedBlocks}
        onUpdatePlacedBlock={handleUpdatePlacedBlock}
      />
      <Player
        heightMap={heightMap}
        mapSize={MAP_SIZE_BLOCKS}
        active={currentMode === 'player'}
        playerRef={playerRef}
        placedBlocks={placedBlocks}
      />
      {visibleChunks.map(({ cx, cz }) => (
        <ChunkRenderer
          key={`${cx}-${cz}`}
          chunkX={cx}
          chunkZ={cz}
          heightMap={heightMap}
          mapSize={MAP_SIZE_BLOCKS}
          onBeforeCompile={onBeforeCompile}
          curvature={CURVATURE_INTENSITY}
          camera={camera}
        />
      ))}
      <group ref={placedBlocksGroupRef}>
        {Object.entries(placedBlocks).map(([key, blockType]) => {
          if (blockType === Block.Air) return null
          const [x, y, z] = key.split(',').map(Number)
          const halfSize = MAP_SIZE_BLOCKS / 2
          const worldX = x - halfSize + 0.5
          const worldY = y + 0.5
          const worldZ = z - halfSize + 0.5
          const meta = BlockMetadata[blockType as Exclude<Block, Block.Air>]
          const color = meta ? meta.color : '#FFFFFF'

          return (
            <mesh
              key={key}
              name="placed-block"
              position={[worldX, worldY, worldZ]}
              userData={{ key, blockType }}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={color} onBeforeCompile={onBeforeCompile} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

export default WorldScene
