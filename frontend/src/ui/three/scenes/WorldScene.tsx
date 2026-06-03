import { useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useMemo, useRef, useState } from 'react'
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
import { IslandMap, BiomeType, getBiomeBlock } from '@/perlin'

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

  for (let chunkX = 0; chunkX < widthInChunks; chunkX++) {
    for (let chunkZ = 0; chunkZ < depthInChunks; chunkZ++) {
      const chunk = new Chunk()

      // Pass 1: Heightmap and terrain blocks placement
      for (let x = 0; x < Chunk.WIDTH; x++) {
        for (let z = 0; z < Chunk.WIDTH; z++) {
          const worldX = chunkX * Chunk.WIDTH + x
          const worldZ = chunkZ * Chunk.WIDTH + z
          const height = islandMap.getHeightAt(worldX, worldZ)
          const biome = islandMap.getBiomeAt(worldX, worldZ)

          // Bedrock at the very bottom
          chunk.setBlock(x, 0, z, Block.Bedrock)

          // Fill vertical blocks based on biome config
          for (let y = 1; y <= height; y++) {
            chunk.setBlock(x, y, z, getBiomeBlock(biome, y, height))
          }
        }
      }

      // Pass 2: Spawn trees in Forest biome (using deterministic hash coordinate positioning)
      for (let x = 2; x < Chunk.WIDTH - 2; x++) {
        for (let z = 2; z < Chunk.WIDTH - 2; z++) {
          const worldX = chunkX * Chunk.WIDTH + x
          const worldZ = chunkZ * Chunk.WIDTH + z
          const height = islandMap.getHeightAt(worldX, worldZ)
          const biome = islandMap.getBiomeAt(worldX, worldZ)

          if (biome === BiomeType.Forest) {
            const hash = (Math.abs(Math.sin(worldX * 12.9898 + worldZ * 78.233) * 43758.5453) % 1)
            
            // 2% chance to spawn a tree in forest biome
            if (hash < 0.02) {
              const treeHeight = 4 + Math.floor(hash * 100) % 2 // 4 or 5 blocks tall
              
              // Place wood trunk
              for (let ty = 1; ty <= treeHeight; ty++) {
                chunk.setBlock(x, height + ty, z, Block.Wood)
              }

              // Place leaves canopy
              for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                  for (let dz = -2; dz <= 2; dz++) {
                    const ly = height + treeHeight + dy
                    if (ly < 1 || ly >= Chunk.HEIGHT) continue

                    const dist = Math.abs(dx) + Math.abs(dy) + Math.abs(dz)
                    if (dist <= 3 && !(dx === 0 && dz === 0 && dy <= 0)) {
                      if (chunk.getBlock(x + dx, ly, z + dz) === Block.Air) {
                        chunk.setBlock(x + dx, ly, z + dz, Block.Leaves)
                      }
                    }
                  }
                }
              }
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
  playerRef: React.RefObject<THREE.Group | null>
  currentMode: 'freecam' | 'player'
}

const WorldShadowLight = ({ playerRef, currentMode }: WorldShadowLightProps) => {
  const { camera } = useThree()
  const lightRef = useRef<THREE.DirectionalLight | null>(null)
  const targetRef = useRef<THREE.Object3D | null>(null)

  useFrame(() => {
    if (!lightRef.current || !targetRef.current) return

    let targetX: number
    let targetZ: number

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
  const playerRef = useRef<THREE.Group | null>(null)

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
        if (blockType === Block.Water) {
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
            { offset: [0, 0], repeat: [w, 1], rotation: 0 },
            { offset: [5 * w, 0], repeat: [w, 1], rotation: 0 },
            { offset: [3 * w, 0], repeat: [w, 1], rotation: 0 },
            { offset: [w, 0], repeat: [w, 1], rotation: 0 }
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

            // Reset color to white by default when texture is loaded, to prevent oversaturation
            mat.color.set('#ffffff' as any)

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

    const newVisibleChunks: { cx: number; cz: number }[] = []
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
    setVisibleChunks((prev) => {
      const currentKeys = prev.map((c) => `${c.cx}-${c.cz}`).join(',')
      if (visibleKeys !== currentKeys) {
        return newVisibleChunks
      }
      return prev
    })
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
