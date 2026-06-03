import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useHotkeys } from 'react-hotkeys-hook'

import { Chunk } from '@/types/maps/Chunk.ts'
import { usePlanetStore } from '@/store/planetStore.ts'
import { useEditorStore } from '@/store/editorStore'
import Player from '../objects/Player'

import { DEMO_PLANET_PROFILES } from './planetSelection/demoPlanetProfiles'
import { ChunkRenderer } from './worldScene/ChunkRenderer'
import { CHUNKS_PER_SIDE, MAP_SIZE_BLOCKS } from './worldScene/constants'
import { FreeCameraControls } from './worldScene/FreeCameraControls'
import { Block } from '@/types/Block'
import { BlockMetadata } from '@/config/Block'
import { LocalMap } from '@/types/maps/LocalMap'
import { IslandMap } from '@/perlin/terrain/IslandMap'

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

interface WorldShadowLightProps {
  playerRef: React.RefObject<THREE.Group>
  currentMode: 'freecam' | 'player'
}

const WorldShadowLight = ({ playerRef, currentMode }: WorldShadowLightProps) => {
  const { camera } = useThree()
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const targetRef = useRef<THREE.Object3D>(null)

  useFrame(() => {
    if (!lightRef.current || !targetRef.current) return

    let targetX = 0
    let targetZ = 0

    if (currentMode === 'player' && playerRef.current) {
      targetX = playerRef.current.position.x
      targetZ = playerRef.current.position.z
    } else {
      targetX = camera.position.x
      targetZ = camera.position.z
    }

    // Shadow camera tracks the player/camera coordinate on the X/Z plane.
    // By tracking the player capsule directly rather than the orbiting camera, we prevent visual shadow shimmering when looking around.
    lightRef.current.position.set(targetX + 150, 250, targetZ + 150)
    targetRef.current.position.set(targetX, 0, targetZ)

    if (lightRef.current.target !== targetRef.current) {
      lightRef.current.target = targetRef.current
    }
  })

  return (
    <>
      <object3D ref={targetRef} />
      <directionalLight
        ref={lightRef}
        intensity={1.2}
        castShadow
        shadow-bias={-0.0005}
        shadow-normalBias={0.05}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-camera-near={0.1}
        shadow-camera-far={500}
      />
    </>
  )
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

  const handleUpdateBlock = (x: number, y: number, z: number, block: Block | null, rotation?: number) => {
    if (rotation !== undefined) {
      localMap.setGlobalBlockRotation(x, y, z, rotation)
    } else {
      const blockValue = block ?? Block.Air
      localMap.setGlobalBlock(x, y, z, blockValue)
    }
    setMapVersion((v) => v + 1)
  }

  const { camera } = useThree()

  const blockAssets = useMemo(() => {
    const assets: Record<
      Exclude<Block, Block.Air>,
      { 
        geometry: THREE.BufferGeometry; 
        material: THREE.Material | THREE.Material[]; 
      }
    > = {} as any

    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const textureLoader = new THREE.TextureLoader()

    Object.values(BlockMetadata).forEach((meta) => {
      const blockType = meta.id as Exclude<Block, Block.Air>

      const materials = Array.from({ length: 6 }).map(() => {
        const mat = new THREE.MeshStandardMaterial({ color: meta.color, envMapIntensity: 0 })
        if (blockType === Block.Water || blockType === Block.Glass) {
          mat.transparent = true
          mat.opacity = 0.6
          mat.depthWrite = false
        }
        return mat
      })
      
      const texturePath = `/three/assets/blocks/textures/${meta.name.toLowerCase()}.png`
      textureLoader.load(
        texturePath,
        (texture) => {
          texture.magFilter = THREE.NearestFilter
          texture.colorSpace = THREE.SRGBColorSpace
          
          const w = 1 / 6
          const faceUVs = [
            { offset: [2 * w, 0], repeat: [w, 1], rotation: 0 },
            { offset: [4 * w, 0], repeat: [w, 1], rotation: 0 },
            { offset: [0 * w, 0], repeat: [w, 1], rotation: 0 },
            { offset: [5 * w, 0], repeat: [w, 1], rotation: 0 },
            { offset: [3 * w, 0], repeat: [w, 1], rotation: 0 },
            { offset: [1 * w, 0], repeat: [w, 1], rotation: 0 }
          ]
          
          materials.forEach((mat, index) => {
            const faceTex = texture.clone()
            const config = faceUVs[index]
            
            faceTex.repeat.set(config.repeat[0], config.repeat[1])
            
            faceTex.center.set(0.5, 0.5)
            faceTex.offset.set(config.offset[0] + config.repeat[0] / 2 - 0.5, config.offset[1] + config.repeat[1] / 2 - 0.5)
            faceTex.rotation = config.rotation
            
            faceTex.needsUpdate = true
            mat.map = faceTex

            mat.needsUpdate = true
          })
        },
        undefined,
        () => {}
      )
      
      assets[blockType] = {
        geometry,
        material: materials,
      }
    })

    return assets
  }, [])


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
      <WorldShadowLight playerRef={playerRef} currentMode={currentMode} />
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
        />
      ))}
    </group>
  )
}

export default WorldScene
