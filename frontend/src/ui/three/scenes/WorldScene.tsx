import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import { useHotkeys } from 'react-hotkeys-hook'

import { Chunk } from '@/types/maps/Chunk.ts'
import { usePlanetStore } from '@/store/planetStore.ts'
import Player from '../objects/Player'
import { applyCurvature, CURVATURE_INTENSITY } from '../utils/curvature'
import { DEMO_PLANET_PROFILES } from './planetSelection/demoPlanetProfiles'
import { ChunkRenderer } from './worldScene/ChunkRenderer'
import { CHUNKS_PER_SIDE, MAP_SIZE_BLOCKS, RENDER_DISTANCE_CHUNKS } from './worldScene/constants'
import { FreeCameraControls } from './worldScene/FreeCameraControls'
import { useHeightMap } from './worldScene/useHeightMap'
import { useEditorStore } from '@/store/editorStore'

const WorldScene = () => {
  const activeIndex = usePlanetStore((state) => state.activeIndex)
  const playerRef = useRef<THREE.Group>(null)
  const editorMode = useEditorStore(state => state.activeEditor);
  const [currentMode, setCurrentMode] = useState<'freecam' | 'player'>('player')

  useHotkeys('c', () => {
    setCurrentMode((prev) => (prev === 'freecam' ? 'player' : 'freecam'))
    editorMode(currentMode != "freecam")
  })


  const profile = useMemo(() => {
    const safeIndex = Math.min(Math.max(activeIndex, 0), DEMO_PLANET_PROFILES.length - 1)
    return DEMO_PLANET_PROFILES[safeIndex]!
  }, [activeIndex])

  const heightMap = useHeightMap(profile, MAP_SIZE_BLOCKS)

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
  })

  return (
    <group>
      <FreeCameraControls
        heightMap={heightMap}
        mapSize={MAP_SIZE_BLOCKS}
        active={currentMode === 'freecam'}
        playerRef={playerRef}
      />
      <Player
        heightMap={heightMap}
        mapSize={MAP_SIZE_BLOCKS}
        active={currentMode === 'player'}
        playerRef={playerRef}
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
    </group>
  )
}

export default WorldScene
