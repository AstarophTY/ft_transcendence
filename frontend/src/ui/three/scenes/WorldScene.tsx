import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'

import { Chunk } from '@/models/maps/Chunk.ts'
import { IslandMap } from '@/perlin/terrain/IslandMap'
import { usePlanetStore } from '@/store/planetStore.ts'
import Player from '../objects/Player'

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
]

const CHUNKS_PER_SIDE = 32
const MAP_SIZE_BLOCKS = CHUNKS_PER_SIDE * Chunk.WIDTH

const FreeCameraControls = ({ heightMap, mapSize, active, playerRef }: { heightMap: Uint16Array, mapSize: number, active: boolean, playerRef: React.RefObject<THREE.Group> }) => {
  const { camera, gl } = useThree()
  const controlsRef = useRef<PointerLockControlsImpl | null>(null)
  const keysRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    if (active) {
      if (playerRef.current) {
        camera.position.copy(playerRef.current.position)
        camera.position.y += 2
      } else {
        camera.position.set(0, 18, 24)
      }
      camera.lookAt(0, 0, 0)
    }
  }, [camera, active, playerRef])

  useEffect(() => {
    if (!active) return
    const handleKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.code] = true
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.code] = false
    }
    const handleClick = () => {
      if (active) {
        controlsRef.current?.lock()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    gl.domElement.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      gl.domElement.removeEventListener('click', handleClick)
    }
  }, [gl.domElement, active])

  useFrame((_, delta) => {
    if (!active) return
    const moveSpeed = 12
    const verticalSpeed = 8
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

    // Boundary constraints
    nextPosition.x = THREE.MathUtils.clamp(nextPosition.x, -halfSize + wallPadding, halfSize - wallPadding)
    nextPosition.z = THREE.MathUtils.clamp(nextPosition.z, -halfSize + wallPadding, halfSize - wallPadding)

    // Function to check if a position is valid (not inside a block)
    const isValidPosition = (pos: THREE.Vector3) => {
      const mapX = Math.floor(pos.x + halfSize)
      const mapZ = Math.floor(pos.z + halfSize)
      const mapIndex = THREE.MathUtils.clamp(mapZ, 0, mapSize - 1) * mapSize + THREE.MathUtils.clamp(mapX, 0, mapSize - 1)
      const groundHeight = heightMap[mapIndex] ?? 0
      // The block occupies space from groundHeight to groundHeight + 1
      // We are inside a block if our y is between groundHeight and groundHeight + 1
      const isInsideBlockVolume = pos.y >= groundHeight && pos.y <= groundHeight + 1
      return !isInsideBlockVolume
    }

    // Collision handling: check each axis separately for sliding
    const finalPosition = camera.position.clone()
    
    // Try vertical movement first
    const verticalPos = finalPosition.clone()
    verticalPos.y = nextPosition.y
    if (isValidPosition(verticalPos)) {
      finalPosition.y = nextPosition.y
    } else {
      // If moving into a block volume from above, snap to top
      const mapX = Math.floor(finalPosition.x + halfSize)
      const mapZ = Math.floor(finalPosition.z + halfSize)
      const mapIndex = THREE.MathUtils.clamp(mapZ, 0, mapSize - 1) * mapSize + THREE.MathUtils.clamp(mapX, 0, mapSize - 1)
      const groundHeight = heightMap[mapIndex] ?? 0
      
      if (finalPosition.y > groundHeight + 1) {
        finalPosition.y = groundHeight + 1.1 // Stay slightly above
      } else if (finalPosition.y < groundHeight) {
        finalPosition.y = groundHeight - 0.1 // Stay slightly below if we were already under
      }
    }

    // Try horizontal X movement
    const xPos = finalPosition.clone()
    xPos.x = nextPosition.x
    if (isValidPosition(xPos)) {
      finalPosition.x = nextPosition.x
    }

    // Try horizontal Z movement
    const zPos = finalPosition.clone()
    zPos.z = nextPosition.z
    if (isValidPosition(zPos)) {
      finalPosition.z = nextPosition.z
    }

    camera.position.copy(finalPosition)
  })

  return active ? <PointerLockControls ref={(node) => { controlsRef.current = node }} /> : null
}

const WorldScene = () => {
  const activeIndex = usePlanetStore((state) => state.activeIndex)
  const playerRef = useRef<THREE.Group>(null)
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
  const { camera } = useThree()

  // Curvature effect
  const curvature = 0.0005
  useFrame(() => {
    if (voxelMeshRef.current) {
      const material = voxelMeshRef.current.material
      if (Array.isArray(material)) return
      
      const meshMaterial = material as THREE.MeshStandardMaterial
      if (meshMaterial.userData.shader) {
        meshMaterial.userData.shader.uniforms.uCameraPosition.value.copy(camera.position)
        meshMaterial.userData.shader.uniforms.uCurvature.value = curvature
      }
    }
  })

  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uCameraPosition = { value: new THREE.Vector3() }
    shader.uniforms.uCurvature = { value: curvature }
    
    shader.vertexShader = `
      uniform vec3 uCameraPosition;
      uniform float uCurvature;
    ` + shader.vertexShader

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      
      // Calcul de la position monde pour l'instance
      vec4 worldPos = instanceMatrix * vec4(position, 1.0);
      worldPos = modelMatrix * worldPos;
      
      float dist = distance(worldPos.xz, uCameraPosition.xz);
      transformed.y -= pow(dist, 2.0) * uCurvature;
      `
    )
    if (voxelMeshRef.current) {
      const material = voxelMeshRef.current.material
      if (!Array.isArray(material)) {
        material.userData.shader = shader
      }
    }
  }

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
        playerRef={playerRef}
      />
      <Player 
        heightMap={heightMap} 
        mapSize={MAP_SIZE_BLOCKS} 
        active={currentMode === 'player'}
        playerRef={playerRef}
      />
      <instancedMesh
        ref={voxelMeshRef}
        args={[undefined, undefined, MAP_SIZE_BLOCKS * MAP_SIZE_BLOCKS]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#FFFFFF" onBeforeCompile={onBeforeCompile} />
      </instancedMesh>
    </group>
  )
}

export default WorldScene
