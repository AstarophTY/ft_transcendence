import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'

import { Chunk } from '../../../models/maps/Chunk.ts'
import { IslandMap } from '@/perlin/terrain/IslandMap'
import { usePlanetStore } from '../../../store/planetStore.ts'
import { Player } from '../objects/Player'

type DemoPlanetProfile = {
  seed: string
  widthInChunks: number
  depthInChunks: number
  scale: number
  octaves: number
  persistence: number
  relief: number
  baseHeight: number
  variationRange: number
}

const DEMO_PLANET_PROFILES: DemoPlanetProfile[] = [
  { seed: 'planet-selection-demo-0', widthInChunks: 4, depthInChunks: 4, scale: 0.045, octaves: 4, persistence: 0.45, relief: 0.65, baseHeight: 17, variationRange: 16 },
  { seed: 'planet-selection-demo-1', widthInChunks: 5, depthInChunks: 4, scale: 0.038, octaves: 3, persistence: 0.38, relief: 0.58, baseHeight: 15, variationRange: 14 },
  { seed: 'planet-selection-demo-2', widthInChunks: 4, depthInChunks: 5, scale: 0.052, octaves: 5, persistence: 0.42, relief: 0.72, baseHeight: 19, variationRange: 12 },
  { seed: 'planet-selection-demo-3', widthInChunks: 6, depthInChunks: 4, scale: 0.033, octaves: 4, persistence: 0.5, relief: 0.55, baseHeight: 13, variationRange: 18 },
  { seed: 'planet-selection-demo-4', widthInChunks: 5, depthInChunks: 5, scale: 0.06, octaves: 6, persistence: 0.35, relief: 0.78, baseHeight: 18, variationRange: 10 },
  { seed: 'planet-selection-demo-5', widthInChunks: 4, depthInChunks: 6, scale: 0.041, octaves: 4, persistence: 0.48, relief: 0.62, baseHeight: 16, variationRange: 15 },
  { seed: 'planet-selection-demo-6', widthInChunks: 6, depthInChunks: 5, scale: 0.029, octaves: 5, persistence: 0.4, relief: 0.68, baseHeight: 14, variationRange: 17 },
  { seed: 'planet-selection-demo-7', widthInChunks: 5, depthInChunks: 6, scale: 0.055, octaves: 3, persistence: 0.52, relief: 0.52, baseHeight: 20, variationRange: 11 },
  { seed: 'planet-selection-demo-8', widthInChunks: 4, depthInChunks: 4, scale: 0.047, octaves: 6, persistence: 0.36, relief: 0.74, baseHeight: 18, variationRange: 13 },
  { seed: 'planet-selection-demo-9', widthInChunks: 6, depthInChunks: 6, scale: 0.036, octaves: 4, persistence: 0.43, relief: 0.6, baseHeight: 15, variationRange: 16 },
]

const CHUNKS_PER_SIDE = 8
const MAP_SIZE_BLOCKS = CHUNKS_PER_SIDE * Chunk.WIDTH

const FreeCameraControls = ({ heightMap, mapSize, active }: { heightMap: Uint16Array<any>, mapSize: number, active: boolean }) => {
  const { camera, gl } = useThree()
  const controlsRef = useRef<PointerLockControlsImpl | null>(null)
  const keysRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    if (active) {
      camera.position.set(0, 18, 24)
      camera.lookAt(0, 0, 0)
    }
  }, [camera, active])

  useEffect(() => {
    if (!active) return
    const handleKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.code] = true
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.code] = false
    }
    const handleClick = () => {
      controlsRef.current?.lock()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    gl.domElement.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      gl.domElement.removeEventListener('click', handleClick)
    }
  }, [gl.domElement])

  useFrame((_, delta) => {
    if (!active) return
    const moveSpeed = 12
    const verticalSpeed = 8
    const eyeHeight = 1.6
    const wallPadding = 0.4
    const halfSize = mapSize / 2
    const moveForward = keysRef.current.KeyW ? 1 : 0
    const moveBackward = keysRef.current.KeyS ? 1 : 0
    const moveLeft = keysRef.current.KeyA ? 1 : 0
    const moveRight = keysRef.current.KeyD ? 1 : 0
    const moveUp = keysRef.current.Space ? 1 : 0
    const moveDown = keysRef.current.ShiftLeft ? 1 : 0

    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()

    const forwardAmount = (moveForward - moveBackward) * moveSpeed * delta
    const rightAmount = (moveRight - moveLeft) * moveSpeed * delta
    const upAmount = (moveUp - moveDown) * verticalSpeed * delta

    const nextPosition = camera.position.clone()
    nextPosition.addScaledVector(forward, forwardAmount)
    nextPosition.addScaledVector(right, rightAmount)
    nextPosition.y += upAmount

    nextPosition.x = THREE.MathUtils.clamp(nextPosition.x, -halfSize + wallPadding, halfSize - wallPadding)
    nextPosition.z = THREE.MathUtils.clamp(nextPosition.z, -halfSize + wallPadding, halfSize - wallPadding)

    const mapX = Math.floor(nextPosition.x + halfSize)
    const mapZ = Math.floor(nextPosition.z + halfSize)
    const mapIndex = THREE.MathUtils.clamp(mapZ, 0, mapSize - 1) * mapSize + THREE.MathUtils.clamp(mapX, 0, mapSize - 1)
    const groundHeight = heightMap[mapIndex] ?? 0

    nextPosition.y = Math.max(nextPosition.y, groundHeight + eyeHeight)

    camera.position.copy(nextPosition)
  })

  return active ? <PointerLockControls ref={controlsRef} /> : null
}

const WorldScene = () => {
  const activeIndex = usePlanetStore((state) => state.activeIndex)
  // Use state for mode to trigger re-renders
  const [currentMode, setCurrentMode] = useState<'freecam' | 'player'>('player')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyC') {
        setCurrentMode(prev => prev === 'freecam' ? 'player' : 'freecam')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const profile = useMemo(() => {
    const safeIndex = Math.min(Math.max(activeIndex, 0), DEMO_PLANET_PROFILES.length - 1)
    return DEMO_PLANET_PROFILES[safeIndex]!
  }, [activeIndex])

  const heightMap = useMemo(() => {
    const islandMap = new IslandMap({
      seed: profile.seed,
      mapSize: MAP_SIZE_BLOCKS,
      maxHeight: Chunk.HEIGHT - 1,
      scale: profile.scale,
      octaves: profile.octaves,
      persistence: profile.persistence,
      relief: profile.relief,
      baseHeight: profile.baseHeight,
      variationRange: profile.variationRange,
    })

    const data = new Uint16Array(MAP_SIZE_BLOCKS * MAP_SIZE_BLOCKS)
    let index = 0

    for (let z = 0; z < MAP_SIZE_BLOCKS; z += 1) {
      for (let x = 0; x < MAP_SIZE_BLOCKS; x += 1) {
        data[index] = islandMap.getHeightAt(x, z)
        index += 1
      }
    }

    return data
  }, [profile])

  const voxelMeshRef = useRef<THREE.InstancedMesh | null>(null)

  useEffect(() => {
    if (!voxelMeshRef.current) {
      return
    }

    const tempMatrix = new THREE.Matrix4()
    const halfSize = MAP_SIZE_BLOCKS / 2

    let index = 0
    for (let z = 0; z < MAP_SIZE_BLOCKS; z += 1) {
      for (let x = 0; x < MAP_SIZE_BLOCKS; x += 1) {
        const height = heightMap[index] ?? 0
        tempMatrix.makeTranslation(
          x - halfSize + 0.5,
          height + 0.5,
          z - halfSize + 0.5,
        )
        if (voxelMeshRef.current) {
          voxelMeshRef.current.setMatrixAt(index, tempMatrix)
        }
        index += 1
      }
    }

    voxelMeshRef.current.instanceMatrix.needsUpdate = true
  }, [heightMap])

  return (
    <group>
      <FreeCameraControls 
        heightMap={heightMap} 
        mapSize={MAP_SIZE_BLOCKS} 
        active={currentMode === 'freecam'} 
      />
      <Player 
        heightMap={heightMap} 
        mapSize={MAP_SIZE_BLOCKS} 
        active={currentMode === 'player'} 
      />
      <instancedMesh
        ref={voxelMeshRef}
        args={[undefined, undefined, MAP_SIZE_BLOCKS * MAP_SIZE_BLOCKS]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#6b8f5a" />
      </instancedMesh>
    </group>
  )
}

export default WorldScene
