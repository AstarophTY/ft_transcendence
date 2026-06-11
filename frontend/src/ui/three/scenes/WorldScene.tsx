import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useHotkeys } from 'react-hotkeys-hook'
import { Loader2 } from 'lucide-react'
import { Chunk } from '@/types/maps/Chunk.ts'
import type { DemoPlanetProfile } from '@/types/Three'
import { usePlanetStore } from '@/store/planetStore.ts'
import { useEditorStore } from '@/store/editorStore'
import { getWorld, type WorldBlock } from '@/lib/api/world'
import { connectWorldSocket, getWorldSocket } from '@/lib/sockets/worldSocket'
import { tokenStore } from '@/lib/api'
import { toast } from 'sonner'
import { getUserId } from '@/lib/user'
import i18n from '@/i18n'
import { usePlayerAppearance } from '../objects/player/playerAppearance'
import { useWorldEconomy } from '@/store/worldEconomy'
import { isPaidBlock } from '@/config/worldBlocks'
import { canEditCurrentWorld, useCanEditCurrentWorld } from '@/lib/permissions'
import { useSeason } from '@/store/season'
import Player from '../objects/Player'
import RemotePlayers from '../objects/RemotePlayers'
import { ChunkRenderer } from './worldScene/ChunkRenderer'
import { MAP_SIZE_BLOCKS, PRIVATE_MAP_SIZE } from './worldScene/constants'
import { FreeCameraControls } from './worldScene/FreeCameraControls'
import { Block } from '@/types/Block'
import { BlockMetadata } from '@/config/Block'
import { LocalMap } from '@/types/maps/LocalMap'
import { IslandMap, BiomeType, getBiomeBlock } from '@/generation'
import { useLookupStore, LookupRecord } from '@/store/lookupStore.ts'
import { Minimap } from './worldScene/Minimap'
import { useTranslation } from 'react-i18next'

// Horizontal reach of a tree canopy, in blocks (matches the ±2 leaf offset loop below).
const TREE_CANOPY_RADIUS = 2

// Deterministic per-column spawn test for a tree trunk.
const treeHashAt = (worldX: number, worldZ: number): number =>
  Math.abs(Math.sin(worldX * 12.9898 + worldZ * 78.233) * 43758.5453) % 1

/**
 * A tree may only grow on ground that stays level across the whole canopy footprint.
 * This makes generation adapt to the terrain: trees never sit on cliffs or slopes, so
 * their canopy can no longer overhang a drop and read as "floating" blocks.
 */
const isGroundFlatForTree = (
  islandMap: IslandMap,
  worldX: number,
  worldZ: number,
  height: number,
  mapSize: number
): boolean => {
  for (let dz = -TREE_CANOPY_RADIUS; dz <= TREE_CANOPY_RADIUS; dz++) {
    for (let dx = -TREE_CANOPY_RADIUS; dx <= TREE_CANOPY_RADIUS; dx++) {
      const nx = worldX + dx
      const nz = worldZ + dz
      if (nx < 0 || nx >= mapSize || nz < 0 || nz >= mapSize) return false
      // Allow only a 1-block height difference under the canopy footprint.
      if (Math.abs(islandMap.getHeightAt(nx, nz) - height) > 1) return false
    }
  }
  return true
}

const generateLocalMap = (profile: DemoPlanetProfile, mapSize: number) => {
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
    applyConstraints: true,
  })

  const isPrivate = usePlanetStore.getState().isPrivateWorld

  for (let chunkX = 0; chunkX < widthInChunks; chunkX++) {
    for (let chunkZ = 0; chunkZ < depthInChunks; chunkZ++) {
      const chunk = new Chunk()

      // Pass 1: Heightmap and terrain blocks placement
      for (let x = 0; x < Chunk.WIDTH; x++) {
        for (let z = 0; z < Chunk.WIDTH; z++) {
          const worldX = chunkX * Chunk.WIDTH + x
          const worldZ = chunkZ * Chunk.WIDTH + z
          const height = isPrivate ? 5 : islandMap.getHeightAt(worldX, worldZ)
          const biome = isPrivate ? BiomeType.Plains : islandMap.getBiomeAt(worldX, worldZ)

          // Bedrock at the very bottom
          chunk.setBlock(x, 0, z, Block.Bedrock)

          // Fill vertical blocks based on biome config
          for (let y = 1; y <= height; y++) {
            chunk.setBlock(x, y, z, getBiomeBlock(biome, y, height))
          }
        }
      }

      if (!isPrivate) {
        // Pass 2: Spawn trees in the Forest biome using deterministic, global-coordinate
        // positioning. We scan one canopy radius beyond the chunk so a tree rooted in a
        // neighbouring chunk still drops the part of its canopy that overlaps this chunk —
        // trees stay whole across chunk borders instead of being clipped.
        for (let lz = -TREE_CANOPY_RADIUS; lz < Chunk.WIDTH + TREE_CANOPY_RADIUS; lz++) {
          for (let lx = -TREE_CANOPY_RADIUS; lx < Chunk.WIDTH + TREE_CANOPY_RADIUS; lx++) {
            const worldX = chunkX * Chunk.WIDTH + lx
            const worldZ = chunkZ * Chunk.WIDTH + lz
            if (worldX < 0 || worldX >= mapSize || worldZ < 0 || worldZ >= mapSize) continue

            if (islandMap.getBiomeAt(worldX, worldZ) !== BiomeType.Forest) continue

            const hash = treeHashAt(worldX, worldZ)
            // 2% chance to spawn a tree in the forest biome
            if (hash >= 0.02) continue

            const height = islandMap.getHeightAt(worldX, worldZ)
            // Only grow on flat ground so the canopy never overhangs a cliff/slope.
            if (!isGroundFlatForTree(islandMap, worldX, worldZ, height, mapSize)) continue

            const treeHeight = 4 + Math.floor(hash * 100) % 2 // 4 or 5 blocks tall

            // Place wood trunk (only when the trunk column lies inside this chunk).
            if (lx >= 0 && lx < Chunk.WIDTH && lz >= 0 && lz < Chunk.WIDTH) {
              for (let ty = 1; ty <= treeHeight; ty++) {
                chunk.setBlock(lx, height + ty, lz, Block.Wood)
              }
            }

            // Place leaves canopy, clamping each leaf to the current chunk's bounds.
            for (let dy = -2; dy <= 2; dy++) {
              for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz <= 2; dz++) {
                  const cx = lx + dx
                  const cz = lz + dz
                  if (cx < 0 || cx >= Chunk.WIDTH || cz < 0 || cz >= Chunk.WIDTH) continue

                  const ly = height + treeHeight + dy
                  if (ly < 1 || ly >= Chunk.HEIGHT) continue

                  const dist = Math.abs(dx) + Math.abs(dy) + Math.abs(dz)
                  if (dist <= 3 && !(dx === 0 && dz === 0 && dy <= 0)) {
                    if (chunk.getBlock(cx, ly, cz) === Block.Air) {
                      chunk.setBlock(cx, ly, cz, Block.Leaves)
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

/** Apply a persisted/edited block to the map, including its orientation. */
const applyWorldBlock = (map: LocalMap, b: WorldBlock) => {
  // Blocks are stored at their final world height: the backend already drops a
  // winning island's floor onto the flat capital surface when copying it to the
  // claim zone (see SeasonService.translateToCapital). So place them as-is — any
  // extra vertical offset here would leave the central island floating.
  if (b.y < 0 || b.y >= Chunk.HEIGHT) return

  // setGlobalBlock resets the rotation, so set the block first.
  map.setGlobalBlock(b.x, b.y, b.z, b.block)
  if (b.rotation) map.setGlobalBlockRotation(b.x, b.y, b.z, b.rotation)
}

const DirectionalLight = 'directionalLight' as unknown as React.ElementType

interface WorldShadowLightProps {
  playerRef: React.RefObject<THREE.Group | null>
  currentMode: 'freecam' | 'player'
}

const WorldShadowLight = ({ playerRef, currentMode }: WorldShadowLightProps) => {
  const { camera } = useThree()
  const lightRef = useRef<THREE.DirectionalLight | null>(null)
  const targetRef = useRef<THREE.Object3D | null>(null)

  useEffect(() => {
    const light = lightRef.current
    if (light) {
      light.shadow.bias = 0
      light.shadow.normalBias = 0.005
      const cam = light.shadow.camera
      cam.left = -120
      cam.right = 120
      cam.top = 120
      cam.bottom = -120
      cam.near = 0.1
      cam.far = 500
      cam.updateProjectionMatrix()
    }
  }, [])

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
      <DirectionalLight
        ref={lightRef}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
    </>
  )
}

const WorldScene = () => {
  const { t } = useTranslation()
  const { camera } = useThree()
  const activeCampusId = usePlanetStore((state) => state.activeCampusId)
  const worlds = usePlanetStore((state) => state.worlds)
  const worldEpoch = usePlanetStore((state) => state.worldEpoch)
  const renderDistance = usePlanetStore((state) => state.renderDistance)
  const isPrivate = usePlanetStore((state) => state.isPrivateWorld)
  const mapSize = isPrivate ? PRIVATE_MAP_SIZE : MAP_SIZE_BLOCKS
  const playerRef = useRef<THREE.Group | null>(null)
  const inEditor = useEditorStore((state) => state.in_editor)
  const activeEditor = useEditorStore((state) => state.activeEditor)
  const currentMode = inEditor ? 'freecam' : 'player'
  const lastLookupTime = useRef<number>(0)
  const LOOKUP_COOLDOWN = 200
  // Reactive edit rights: re-renders when the season phase flips (e.g. when the
  // build window opens/closes), so the effect below runs without a page refresh.
  const canEdit = useCanEditCurrentWorld()

  useHotkeys('c', () => {
    // Only 42 accounts may freecam, and only on their own campus/personal planet.
    if (!canEditCurrentWorld()) return
    activeEditor(!inEditor)
  })

  // Leave freecam if the user loses edit rights (e.g. flies to another campus,
  // or the season's build phase ends).
  useEffect(() => {
    if (inEditor && !canEdit) activeEditor(false)
  }, [inEditor, canEdit, activeEditor])

  const visitUserId = usePlanetStore((state) => state.visitUserId)
  // The island currently shown when private: a visited user's, else our own.
  const privateOwnerId = visitUserId ?? getUserId()

  // Generation profile of the selected campus world.
  const profile = useMemo(() => {
    if (isPrivate) {
      return {
        seed: privateOwnerId || 'private-world',
        widthInChunks: 4,
        depthInChunks: 4,
        scale: 0.05,
        octaves: 4,
        persistence: 0.5,
        relief: 0.5,
        baseHeight: 5,
        variationRange: 5,
      }
    }
    return worlds.find((w) => w.campusId === activeCampusId) ?? worlds[0] ?? null
  }, [worlds, activeCampusId, isPrivate, privateOwnerId])

  const [localMap, setLocalMap] = useState<LocalMap | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mapVersion, setMapVersion] = useState(0)
  // Latest map, for the socket listener which is registered once per campus.
  const mapRef = useRef<LocalMap | null>(localMap)
  // Previous block state per edited position, to roll back rejected placements.
  const prevStates = useRef<Map<string, { block: Block; rotation: number }>>(
    new Map(),
  )

  useEffect(() => {
    const isPrivate = usePlanetStore.getState().isPrivateWorld
    if (!profile || (!isPrivate && !activeCampusId)) return
    setIsLoaded(false)
    let cancelled = false

    setTimeout(() => {
      if (cancelled) return
      const isPrivate = usePlanetStore.getState().isPrivateWorld
      const size = isPrivate ? PRIVATE_MAP_SIZE : MAP_SIZE_BLOCKS
      const map = generateLocalMap(profile, size)
      mapRef.current = map
      setLocalMap(map)
      setMapVersion((v) => v + 1)
      const isPrivateWorld = usePlanetStore.getState().isPrivateWorld
      const ownerId = usePlanetStore.getState().visitUserId ?? getUserId()
      getWorld(isPrivateWorld ? ownerId : activeCampusId)
        .then((detail) => {
          if (cancelled) return
          for (const b of detail.blocks) applyWorldBlock(map, b)
          setMapVersion((v) => v + 1)
          setIsLoaded(true)
        })
        .catch(() => {
          if (cancelled) return
          setIsLoaded(true)
        })
    }, 50)

    return () => {
      cancelled = true
    }
  }, [activeCampusId, profile, worldEpoch])

  useEffect(() => {
    if (!activeCampusId && !isPrivate) return
    const token = tokenStore.access
    if (!token) return
    const socket = connectWorldSocket(token)

    useWorldEconomy.getState().reset()

    const onCoins = ({
      campusId,
      coins,
    }: {
      campusId: string
      coins: number
    }) => {
      if (campusId === activeCampusId) useWorldEconomy.getState().setCoins(coins)
    }
    socket.on('world:coins', onCoins)

    socket.emit('world:join', { campusId: activeCampusId, personalWorld: isPrivate })

    const onRemoteEdit = ({ blocks }: { blocks: WorldBlock[] }) => {
      const map = mapRef.current
      if (!map) return
      for (const b of blocks) applyWorldBlock(map, b)
      setMapVersion((v) => v + 1)
    }

    const onLookupResponse = (data: LookupRecord[]) => {
      useLookupStore.getState().setResults(data)
    }

    socket.on('world:edit', onRemoteEdit)
    socket.on('world:lookup:res', onLookupResponse)

    const onRevert = ({
      positions,
    }: {
      positions: { x: number; y: number; z: number }[]
    }) => {
      const map = mapRef.current
      if (!map) return
      for (const pos of positions) {
        const key = `${pos.x},${pos.y},${pos.z}`
        const prev = prevStates.current.get(key)
        if (prev) {
          map.setGlobalBlock(pos.x, pos.y, pos.z, prev.block)
          map.setGlobalBlockRotation(pos.x, pos.y, pos.z, prev.rotation)
          prevStates.current.delete(key)
        }
      }
      setMapVersion((v) => v + 1)
    }
    socket.on('world:revert', onRevert)

    const onDisconnect = (reason: string) => {
      if (reason === 'io client disconnect') return
      toast.error(i18n.t('world.connectionLost', { defaultValue: 'Connection lost. Returning to planet selection.' }))
      usePlanetStore.getState().setSceneMode('selection')
    }
    socket.on('disconnect', onDisconnect)

    // The server freezes building outside a season's BUILD phase.
    const onLocked = () => {
      toast.error(i18n.t('season.buildLocked'))
    }
    socket.on('world:locked', onLocked)

    // A new season reset every world: refetch the (reseeded) planets and the
    // current world's blocks, and refresh the phase so edit gating updates.
    const onReset = () => {
      void usePlanetStore.getState().reloadWorlds()
      void useSeason.getState().loadCurrent()
      toast.info(i18n.t('season.worldReset'))
    }
    socket.on('world:reset', onReset)

    return () => {
      socket.emit('world:leave', { campusId: activeCampusId, personalWorld: isPrivate })
      socket.off('world:edit', onRemoteEdit)
      socket.off('world:lookup:res', onLookupResponse)
      socket.off('world:coins', onCoins)
      socket.off('world:revert', onRevert)
      socket.off('disconnect', onDisconnect)
      socket.off('world:locked', onLocked)
      socket.off('world:reset', onReset)
    }
  }, [activeCampusId, isPrivate])

  // Broadcast our own transform to the island, throttled and only when it
  // changed. We always send the body; in freecam we also send the flying camera
  // so peers see both the avatar and a camera marker.
  const lastSent = useRef({ t: 0, key: '' })
  const camDir = useRef(new THREE.Vector3())
  useFrame(() => {
    const socket = getWorldSocket()
    const { activeCampusId, isPrivateWorld } = usePlanetStore.getState()
    const p = playerRef.current
    if (!socket || (!activeCampusId && !isPrivateWorld) || !p) return

    const freecam = currentMode === 'freecam'
    const round = (n: number) => Math.round(n * 50) / 50 // ~0.02 step


    camera.getWorldDirection(camDir.current)

    const skin = usePlayerAppearance.getState().skinColor
    const payload: {
      campusId?: string
      personalWorld?: boolean
      p: [number, number, number]
      r: number
      m: 'player' | 'freecam'
      c?: [number, number, number]
      cr?: number

      cp?: number
      skin: string
    } = {
      p: [round(p.position.x), round(p.position.y), round(p.position.z)],
      r: round(p.rotation.y),
      m: freecam ? 'freecam' : 'player',

      cp: round(Math.asin(camDir.current.y)),
      skin,
    }

    if (activeCampusId) {
      payload.campusId = activeCampusId
    }
    payload.personalWorld = isPrivateWorld

    if (freecam) {
      payload.c = [
        round(camera.position.x),
        round(camera.position.y),
        round(camera.position.z),
      ]
      payload.cr = round(Math.atan2(camDir.current.x, camDir.current.z))
    }


    // A signature that captures everything peers care about (incl. mode/skin).
    const key = `${payload.m}|${payload.p.join(',')}|${payload.r}|${payload.c?.join(',') ?? ''}|${payload.cr ?? ''}|${payload.cp ?? ''}|${payload.skin}`
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
    const { activeCampusId, isPrivateWorld } = usePlanetStore.getState()
    const socket = getWorldSocket()
    if (!socket || pendingBlocks.current.length === 0) return
    if (!activeCampusId && !isPrivateWorld) return

    const batch = pendingBlocks.current
    pendingBlocks.current = []

    socket.emit('world:edit', { 
      campusId: activeCampusId, 
      blocks: batch,
      personalWorld: isPrivateWorld
    })
  }, [])

  // Flush any pending edits when leaving the world.
  useEffect(() => () => flushBlocks(), [flushBlocks])

  const handleUpdateBlock = (x: number, y: number, z: number, block: Block | null, rotation?: number) => {
    if (!localMap) return
    // Guests (non-42) can't touch blocks, and 42 users only on their own worlds.
    if (!canEditCurrentWorld()) return

    const isPrivate = usePlanetStore.getState().isPrivateWorld
    const blockValue = block ?? Block.Air
    const isRotation = rotation !== undefined
    const isPlacement = !isRotation && block !== null && blockValue !== Block.Air

    // Can't place a paid block when the campus has no coins left.
    // null means we haven't received the balance yet — let the server validate.
    const economy = useWorldEconomy.getState()
    if (!isPrivate && isPlacement && isPaidBlock(blockValue) && economy.coins !== null && economy.coins <= 0) {
      toast.error(i18n.t('world.noCoins', { defaultValue: 'Your campus is out of coins' }))
      return
    }

    // Remember the prior state in case the server rejects this placement.
    const prevBlock = localMap.getGlobalBlock(x, y, z)
    prevStates.current.set(`${x},${y},${z}`, {
      block: prevBlock,
      rotation: localMap.getGlobalBlockRotation(x, y, z),
    })

    if (isRotation) {
      localMap.setGlobalBlockRotation(x, y, z, rotation)
    } else {
      localMap.setGlobalBlock(x, y, z, blockValue)
    }
    setMapVersion((v) => v + 1)

    // Optimistic coin change; the server's `world:coins` reconciles it.
    if (!isPrivate) {
      if (isPlacement && isPaidBlock(blockValue)) economy.adjust(-1)
      else if (block === null && isPaidBlock(prevBlock)) economy.adjust(1)
    }

    pendingBlocks.current.push({ x, y, z, block: blockValue, rotation: rotation ?? 0 })
    // Coalesce bursts into ~100ms batches, but keep flushing while editing
    // continuously so peers stay in sync (don't reset a pending timer).
    if (!flushTimer.current) flushTimer.current = setTimeout(flushBlocks, 100)
  }

  const handleLookupBlock = (x: number, y: number, z: number) => {
    if (!localMap) return
    const now = performance.now()
    if (now - lastLookupTime.current < LOOKUP_COOLDOWN) {
      return
    }

    const isMobile = window.matchMedia("(max-width: 767px)").matches || 
                     window.matchMedia("(max-width: 1023px) and (orientation: landscape)").matches
    if (isMobile) {
      useEditorStore.getState().setCatalogOpen(false)
    }

    useLookupStore.getState().openLookup()

    const socket = getWorldSocket()
    const isPrivate = usePlanetStore.getState().isPrivateWorld
    if (!socket || (!activeCampusId && !isPrivate)) return

    lastLookupTime.current = now
    socket.emit('world:lookup', {
      campusId: isPrivate ? getUserId() : activeCampusId,
      x,
      y,
      z
    })
  }

  const blockAssets = useMemo(() => {
    const assets: Record<
      Exclude<Block, Block.Air>,
      { 
        geometry: THREE.BufferGeometry; 
        material: THREE.Material | THREE.Material[]; 
      }
    > = {} as unknown as Record<
      Exclude<Block, Block.Air>,
      { 
        geometry: THREE.BufferGeometry; 
        material: THREE.Material | THREE.Material[]; 
      }
    >

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
            mat.color.set(new THREE.Color('#ffffff'))

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
    const isPrivate = usePlanetStore.getState().isPrivateWorld
    const size = isPrivate ? PRIVATE_MAP_SIZE : MAP_SIZE_BLOCKS
    const cameraChunkX = Math.floor((camera.position.x + size / 2) / Chunk.WIDTH)
    const cameraChunkZ = Math.floor((camera.position.z + size / 2) / Chunk.WIDTH)

    const newVisibleChunks: { cx: number; cz: number }[] = []
    const chunksPerSide = size / Chunk.WIDTH
    for (let cz = 0; cz < chunksPerSide; cz++) {
      for (let cx = 0; cx < chunksPerSide; cx++) {
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

  if (!localMap || !isLoaded) {
    return (
      <Html 
        fullscreen 
        zIndexRange={[100, 100]}
        calculatePosition={(_, __, size) => [size.width / 2, size.height / 2]}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
          <h2 className="text-2xl font-bold tracking-tight text-primary">{t('world.loading')}</h2>
        </div>
      </Html>
    )
  }

  return (
    <group>
      <Minimap
        localMap={localMap}
        mapVersion={mapVersion}
        playerRef={playerRef}
        currentMode={currentMode}
        mapSize={mapSize}
      />
      <WorldShadowLight playerRef={playerRef} currentMode={currentMode} />
      <FreeCameraControls
        localMap={localMap}
        mapSize={mapSize}
        active={currentMode === 'freecam'}
        playerRef={playerRef}
        onLookupBlock={handleLookupBlock}
        onUpdateBlock={handleUpdateBlock}
      />
      <Player
        localMap={localMap}
        active={currentMode === 'player'}
        playerRef={playerRef}
      />
      {(activeCampusId || isPrivate) && <RemotePlayers campusId={activeCampusId || 'personal'} />}
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
