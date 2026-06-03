import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useHotkeys } from 'react-hotkeys-hook'

import { Chunk } from '@/types/maps/Chunk.ts'
import { usePlanetStore } from '@/store/planetStore.ts'
import { useEditorStore } from '@/store/editorStore'
import { getWorld, type WorldBlock } from '@/lib/world'
import { connectWorldSocket, getWorldSocket } from '@/lib/worldSocket'
import { tokenStore } from '@/lib/api'
import Player from '../objects/Player'
import RemotePlayers from '../objects/RemotePlayers'
import { applyCurvature, updateCurvatureUniforms } from '../utils/curvature'
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

const WorldScene = () => {
  const { camera } = useThree()
  const activeCampusId = usePlanetStore((state) => state.activeCampusId)
  const worlds = usePlanetStore((state) => state.worlds)
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

  // Generation profile of the selected campus world.
  const profile = useMemo(
    () => worlds.find((w) => w.campusId === activeCampusId) ?? worlds[0] ?? null,
    [worlds, activeCampusId],
  )

  const [localMap, setLocalMap] = useState<LocalMap | null>(() =>
    profile ? generateLocalMap(profile, MAP_SIZE_BLOCKS) : null,
  )
  const [, setMapVersion] = useState(0)
  // Latest map, for the socket listener which is registered once per campus.
  const mapRef = useRef<LocalMap | null>(localMap)

  // Rebuild the base terrain from the profile, then apply the persisted block
  // edits (placed and broken) fetched for this campus.
  useEffect(() => {
    if (!profile || !activeCampusId) return
    const map = generateLocalMap(profile, MAP_SIZE_BLOCKS)
    mapRef.current = map
    setLocalMap(map)
    setMapVersion((v) => v + 1)

    let cancelled = false
    getWorld(activeCampusId)
      .then((detail) => {
        if (cancelled) return
        for (const b of detail.blocks) {
          map.setGlobalBlock(b.x, b.y, b.z, b.block)
        }
        setMapVersion((v) => v + 1)
      })
      .catch(() => {
        /* keep the freshly generated terrain if the edits cannot be loaded */
      })
    return () => {
      cancelled = true
    }
  }, [activeCampusId, profile])

  // Live sync: join this campus's room and apply edits from the other players
  // standing on the same island.
  useEffect(() => {
    if (!activeCampusId) return
    const token = tokenStore.access
    if (!token) return
    const socket = connectWorldSocket(token)
    socket.emit('world:join', { campusId: activeCampusId })

    const onRemoteEdit = ({ blocks }: { blocks: WorldBlock[] }) => {
      const map = mapRef.current
      if (!map) return
      for (const b of blocks) map.setGlobalBlock(b.x, b.y, b.z, b.block)
      setMapVersion((v) => v + 1)
    }
    socket.on('world:edit', onRemoteEdit)

    return () => {
      socket.emit('world:leave', { campusId: activeCampusId })
      socket.off('world:edit', onRemoteEdit)
    }
  }, [activeCampusId])

  // Broadcast our own transform to the island, throttled and only when it
  // changed. We always send the body; in freecam we also send the flying camera
  // so peers see both the avatar and a camera marker.
  const lastSent = useRef({ t: 0, key: '' })
  const camDir = useRef(new THREE.Vector3())
  useFrame(() => {
    const socket = getWorldSocket()
    const campusId = usePlanetStore.getState().activeCampusId
    const p = playerRef.current
    if (!socket || !campusId || !p) return

    const freecam = currentMode === 'freecam'
    const round = (n: number) => Math.round(n * 50) / 50 // ~0.02 step

    const payload: {
      campusId: string
      p: [number, number, number]
      r: number
      m: 'player' | 'freecam'
      c?: [number, number, number]
      cr?: number
    } = {
      campusId,
      p: [round(p.position.x), round(p.position.y), round(p.position.z)],
      r: round(p.rotation.y),
      m: freecam ? 'freecam' : 'player',
    }

    if (freecam) {
      camera.getWorldDirection(camDir.current)
      payload.c = [
        round(camera.position.x),
        round(camera.position.y),
        round(camera.position.z),
      ]
      payload.cr = round(Math.atan2(camDir.current.x, camDir.current.z))
    }

    // A signature that captures everything peers care about (incl. mode switch).
    const key = `${payload.m}|${payload.p.join(',')}|${payload.r}|${payload.c?.join(',') ?? ''}|${payload.cr ?? ''}`
    const now = performance.now()
    const last = lastSent.current
    if (key === last.key || now - last.t < 66) return // ~15 Hz, only on change

    last.t = now
    last.key = key
    socket.emit('player:move', payload)
  })

  // Broadcast (and persist) block edits in small coalesced batches.
  const pendingBlocks = useRef<WorldBlock[]>([])
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushBlocks = useCallback(() => {
    flushTimer.current = null
    const campusId = usePlanetStore.getState().activeCampusId
    const socket = getWorldSocket()
    if (!campusId || !socket || pendingBlocks.current.length === 0) return
    const batch = pendingBlocks.current
    pendingBlocks.current = []
    // The gateway relays this to the other players and persists it.
    socket.emit('world:edit', { campusId, blocks: batch })
  }, [])

  // Flush any pending edits when leaving the world.
  useEffect(() => () => flushBlocks(), [flushBlocks])

  const handleUpdateBlock = (x: number, y: number, z: number, block: Block | null) => {
    if (!localMap) return
    const blockValue = block ?? Block.Air
    localMap.setGlobalBlock(x, y, z, blockValue)
    setMapVersion((v) => v + 1)

    pendingBlocks.current.push({ x, y, z, block: blockValue })
    // Coalesce bursts into ~100ms batches, but keep flushing while editing
    // continuously so peers stay in sync (don't reset a pending timer).
    if (!flushTimer.current) flushTimer.current = setTimeout(flushBlocks, 100)
  }

  const onBeforeCompile = useMemo(
    () =>
      function (this: THREE.Material, shader: THREE.WebGLProgramParametersWithUniforms) {
        applyCurvature(shader, this)
      },
    []
  )

  const blockAssets = useMemo(() => {
    const assets: Record<
      Exclude<Block, Block.Air>,
      { 
        geometry: THREE.BufferGeometry; 
        material: THREE.Material | THREE.Material[]; 
        customDepthMaterial: THREE.Material;
      }
    > = {} as any

    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const textureLoader = new THREE.TextureLoader()

    Object.values(BlockMetadata).forEach((meta) => {
      const blockType = meta.id as Exclude<Block, Block.Air>
      
      const customDepthMaterial = new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGBADepthPacking
      })
      customDepthMaterial.onBeforeCompile = onBeforeCompile

      const materials = Array.from({ length: 6 }).map(() => {
        const mat = new THREE.MeshStandardMaterial({ color: meta.color })
        mat.onBeforeCompile = onBeforeCompile
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
            mat.color.setHex(0xffffff)
            mat.needsUpdate = true
          })
        },
        undefined,
        () => {}
      )
      
      assets[blockType] = {
        geometry,
        material: materials,
        customDepthMaterial
      }
    })

    return assets
  }, [onBeforeCompile])

  // Single useFrame hook to update curvature uniforms once per frame for all shared materials
  useFrame(() => {
    Object.values(blockAssets).forEach((asset) => {
      if (Array.isArray(asset.material)) {
        asset.material.forEach((mat) => updateCurvatureUniforms(mat, camera))
      } else {
        updateCurvatureUniforms(asset.material, camera)
      }
      if (asset.customDepthMaterial) {
        updateCurvatureUniforms(asset.customDepthMaterial, camera)
      }
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

  if (!localMap) return null

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
      {activeCampusId && <RemotePlayers campusId={activeCampusId} />}
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
