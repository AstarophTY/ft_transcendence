import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useHotkeys } from 'react-hotkeys-hook'
import { useGLTF } from '@react-three/drei'

import { Chunk } from '@/types/maps/Chunk.ts'
import { usePlanetStore } from '@/store/planetStore.ts'
import { useEditorStore } from '@/store/editorStore'
import Player from '../objects/Player'
import { applyCurvature, updateCurvatureUniforms } from '../utils/curvature'
import { DEMO_PLANET_PROFILES } from './planetSelection/demoPlanetProfiles'
import { ChunkRenderer } from './worldScene/ChunkRenderer'
import { CHUNKS_PER_SIDE, MAP_SIZE_BLOCKS } from './worldScene/constants'
import { FreeCameraControls } from './worldScene/FreeCameraControls'
import { Block } from '@/types/Block'
import { LocalMap } from '@/types/maps/LocalMap'
import { IslandMap } from '@/perlin/terrain/IslandMap'

const BLOCK_MODEL_PATHS: Record<Exclude<Block, Block.Air>, string> = {
  [Block.Stone]: '/three/assets/blocks/stone.gltf',
  [Block.Dirt]: '/three/assets/blocks/dirt.gltf',
  [Block.Grass]: '/three/assets/blocks/dirt_with_grass.gltf',
  [Block.Wood]: '/three/assets/blocks/wood.gltf',
  [Block.Leaves]: '/three/assets/blocks/decorative_block_green.gltf',
  [Block.Water]: '/three/assets/blocks/water.gltf',
  [Block.Sand]: '/three/assets/blocks/sand_A.gltf',
  [Block.Glass]: '/three/assets/blocks/glass.gltf',
  [Block.Bedrock]: '/three/assets/blocks/stone_dark.gltf',
}

Object.values(BLOCK_MODEL_PATHS).forEach((path) => {
  useGLTF.preload(path)
})

const generateLocalMap = (profile: any, mapSize: number) => {
  const widthInChunks = mapSize / Chunk.WIDTH
  const depthInChunks = mapSize / Chunk.WIDTH
  const localMap = new LocalMap(widthInChunks, depthInChunks)

  const islandMap = new IslandMap({
    seed: profile.seed,
    mapSize,
    maxHeight: Chunk.HEIGHT - 1,
    scale: profile.scale,
    octaves: profile.octaves,
    persistence: profile.persistence,
    relief: profile.relief,
    baseHeight: profile.baseHeight,
    variationRange: profile.variationRange,
  })

  const waterHeight = 15

  for (let chunkX = 0; chunkX < widthInChunks; chunkX++) {
    for (let chunkZ = 0; chunkZ < depthInChunks; chunkZ++) {
      const chunk = new Chunk()

      for (let x = 0; x < Chunk.WIDTH; x++) {
        for (let z = 0; z < Chunk.WIDTH; z++) {
          const worldX = chunkX * Chunk.WIDTH + x
          const worldZ = chunkZ * Chunk.WIDTH + z
          const height = islandMap.getHeightAt(worldX, worldZ)

          // 1. Bedrock at the very bottom
          chunk.setBlock(x, 0, z, Block.Bedrock)

          // 2. y from 1 up to height
          for (let y = 1; y <= height; y++) {
            if (height < waterHeight) {
              // Below water level: Sand top + Stone below
              if (y >= height - 2) {
                chunk.setBlock(x, y, z, Block.Sand)
              } else {
                chunk.setBlock(x, y, z, Block.Stone)
              }
            } else {
              // Above water level: Grass top, Dirt middle, Stone below
              if (y === height) {
                chunk.setBlock(x, y, z, Block.Grass)
              } else if (y >= height - 3) {
                chunk.setBlock(x, y, z, Block.Dirt)
              } else {
                chunk.setBlock(x, y, z, Block.Stone)
              }
            }
          }

          // 3. Water layer: height + 1 to waterHeight (if height < waterHeight)
          if (height < waterHeight) {
            for (let y = height + 1; y <= waterHeight; y++) {
              chunk.setBlock(x, y, z, Block.Water)
            }
          }
        }
      }

      localMap.setChunk(chunkX, chunkZ, chunk)
    }
  }

  return localMap
}

const WorldScene = () => {
  const activeIndex = usePlanetStore((state) => state.activeIndex)
  const renderDistance = usePlanetStore((state) => state.renderDistance)
  const playerRef = useRef<THREE.Group>(null)

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

  const [localMap, setLocalMap] = useState<LocalMap>(() => generateLocalMap(profile, MAP_SIZE_BLOCKS))
  const [, setMapVersion] = useState(0)

  useEffect(() => {
    setLocalMap(generateLocalMap(profile, MAP_SIZE_BLOCKS))
    setMapVersion((v) => v + 1)
  }, [profile])

  const handleUpdateBlock = (x: number, y: number, z: number, block: Block | null) => {
    const blockValue = block ?? Block.Air
    localMap.setGlobalBlock(x, y, z, blockValue)
    setMapVersion((v) => v + 1)
  }

  const { camera } = useThree()

  const onBeforeCompile = useMemo(
    () =>
      function (this: THREE.Material, shader: THREE.WebGLProgramParametersWithUniforms) {
        applyCurvature(shader, this)
      },
    []
  )

  // Preload all 3D assets at the scene level to completely bypass useGLTF inside ChunkRenderer
  const stoneGLTF = useGLTF(BLOCK_MODEL_PATHS[Block.Stone])
  const dirtGLTF = useGLTF(BLOCK_MODEL_PATHS[Block.Dirt])
  const grassGLTF = useGLTF(BLOCK_MODEL_PATHS[Block.Grass])
  const woodGLTF = useGLTF(BLOCK_MODEL_PATHS[Block.Wood])
  const leavesGLTF = useGLTF(BLOCK_MODEL_PATHS[Block.Leaves])
  const waterGLTF = useGLTF(BLOCK_MODEL_PATHS[Block.Water])
  const sandGLTF = useGLTF(BLOCK_MODEL_PATHS[Block.Sand])
  const glassGLTF = useGLTF(BLOCK_MODEL_PATHS[Block.Glass])
  const bedrockGLTF = useGLTF(BLOCK_MODEL_PATHS[Block.Bedrock])

  const blockAssets = useMemo(() => {
    const assets: Record<
      Exclude<Block, Block.Air>,
      { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] }
    > = {} as any

    const mapping = {
      [Block.Stone]: stoneGLTF,
      [Block.Dirt]: dirtGLTF,
      [Block.Grass]: grassGLTF,
      [Block.Wood]: woodGLTF,
      [Block.Leaves]: leavesGLTF,
      [Block.Water]: waterGLTF,
      [Block.Sand]: sandGLTF,
      [Block.Glass]: glassGLTF,
      [Block.Bedrock]: bedrockGLTF,
    }

    Object.entries(mapping).forEach(([blockStr, gltf]) => {
      const blockType = Number(blockStr) as Exclude<Block, Block.Air>
      const mesh = Object.values(gltf.nodes).find((node) => (node as THREE.Mesh).isMesh) as THREE.Mesh | undefined
      if (mesh) {
        const mat = mesh.material
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            if (!m.onBeforeCompile) {
              m.onBeforeCompile = onBeforeCompile
            }
          })
        } else {
          if (!mat.onBeforeCompile) {
            mat.onBeforeCompile = onBeforeCompile
          }
        }

        if (blockType === Block.Water) {
          if (Array.isArray(mat)) {
            mat.forEach((m) => {
              m.transparent = true
              m.opacity = 0.6
              m.depthWrite = false
            })
          } else {
            mat.transparent = true
            mat.opacity = 0.6
            mat.depthWrite = false
          }
        }

        assets[blockType] = {
          geometry: mesh.geometry,
          material: mat,
        }
      }
    })

    return assets
  }, [
    stoneGLTF,
    dirtGLTF,
    grassGLTF,
    woodGLTF,
    leavesGLTF,
    waterGLTF,
    sandGLTF,
    glassGLTF,
    bedrockGLTF,
    onBeforeCompile,
  ])

  // Single useFrame hook to update curvature uniforms once per frame for all shared materials
  useFrame(() => {
    Object.values(blockAssets).forEach((asset) => {
      updateCurvatureUniforms(asset.material, camera)
    })
  })

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
        if (distSq <= renderDistance * renderDistance) {
          newVisibleChunks.push({ cx, cz })
        }
      }
    }

    const visibleKeys = newVisibleChunks.map((c) => `${c.cx}-${c.cz}`).join(',')
    const currentKeys = visibleChunks.map((c) => `${c.cx}-${c.cz}`).join(',')

    if (visibleKeys !== currentKeys) {
      setVisibleChunks(newVisibleChunks)
    }
  })

  return (
    <group>
      <FreeCameraControls
        localMap={localMap}
        mapSize={MAP_SIZE_BLOCKS}
        active={currentMode === 'freecam'}
        playerRef={playerRef}
        onUpdateBlock={handleUpdateBlock}
      />
      <Player
        localMap={localMap}
        active={currentMode === 'player'}
        playerRef={playerRef}
      />
      {visibleChunks.map(({ cx, cz }) => (
        <ChunkRenderer
          key={`${cx}-${cz}`}
          chunkX={cx}
          chunkZ={cz}
          localMap={localMap}
          blockAssets={blockAssets}
          camera={camera}
        />
      ))}
    </group>
  )
}

export default WorldScene
