import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'

import { PLAYER_BOUNDARY_PADDING } from './config'
import React from "react";
import { LocalMap } from '@/types/maps/LocalMap'
import { Block } from '@/types/Block'
import { Chunk } from '@/types/maps/Chunk'

type Params = {
  active: boolean
  camera: THREE.Camera
  playerRef: React.RefObject<THREE.Group>
  controlsRef: React.RefObject<PointerLockControlsImpl>
  keysRef: React.MutableRefObject<Record<string, boolean>>
  scene: THREE.Object3D
  mapSize: number
  localMap: LocalMap
}

export const useThirdPersonCamera = ({ active, camera, playerRef, controlsRef, keysRef, mapSize, localMap }: Params) => {
  const pitchRef = React.useRef(0.463) // start at ~26 degrees looking down

  useFrame((_, delta) => {
    if (!playerRef.current) return

    const halfSize = mapSize / 2
    playerRef.current.position.x = THREE.MathUtils.clamp(playerRef.current.position.x, -halfSize + PLAYER_BOUNDARY_PADDING, halfSize - PLAYER_BOUNDARY_PADDING)
    playerRef.current.position.z = THREE.MathUtils.clamp(playerRef.current.position.z, -halfSize + PLAYER_BOUNDARY_PADDING, halfSize - PLAYER_BOUNDARY_PADDING)

    if (!active) return

    const checkCollision = (start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3 => {
      const dir = new THREE.Vector3().subVectors(end, start)
      const maxDist = dir.length()
      dir.normalize()
      
      const step = 0.5
      let currentDist = 0
      let finalPos = end.clone()

      while (currentDist <= maxDist) {
        const checkPos = start.clone().addScaledVector(dir, currentDist)
        
        const globalX = Math.floor(checkPos.x + halfSize)
        const globalZ = Math.floor(checkPos.z + halfSize)
        const adjustedY = Math.floor(checkPos.y)

        if (adjustedY >= 0 && adjustedY < Chunk.HEIGHT) {
          const block = localMap.getGlobalBlock(globalX, adjustedY, globalZ)
          if (block !== Block.Air && block !== Block.Water) {
            finalPos = start.clone().addScaledVector(dir, Math.max(0, currentDist - 0.5))
            break
          }
        }

        currentDist += step
      }
      return finalPos
    }

    if (controlsRef.current?.isLocked) {
      const distance = 10
      const height = 1

      const offset = new THREE.Vector3(0, 0, distance)
      offset.applyQuaternion(camera.quaternion)

      const targetPos = new THREE.Vector3(
        playerRef.current.position.x + offset.x,
        playerRef.current.position.y + height + offset.y,
        playerRef.current.position.z + offset.z,
      )

      const startPos = new THREE.Vector3(
        playerRef.current.position.x,
        playerRef.current.position.y + height,
        playerRef.current.position.z,
      )

      camera.position.copy(checkCollision(startPos, targetPos))
      return
    }

    // Dynamic pitch rotation on mobile/unlocked camera
    const pitchSpeed = 1.5 // radians per second
    if (keysRef.current.ArrowUp) {
      pitchRef.current -= pitchSpeed * delta
    }
    if (keysRef.current.ArrowDown) {
      pitchRef.current += pitchSpeed * delta
    }
    // Clamp vertical look angle so the camera doesn't flip upside down
    pitchRef.current = THREE.MathUtils.clamp(pitchRef.current, -Math.PI / 6, Math.PI / 2.2)

    const startPos = new THREE.Vector3(
      playerRef.current.position.x,
      playerRef.current.position.y + 1,
      playerRef.current.position.z,
    )

    // Calculate spherical-like offset behind the player
    const pitchOffset = new THREE.Vector3(0, 0, 10)
    const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRef.current)
    pitchOffset.applyQuaternion(pitchQuat)
    pitchOffset.applyQuaternion(playerRef.current.quaternion)

    const safeTargetPos = checkCollision(startPos, startPos.clone().add(pitchOffset))

    camera.position.lerp(safeTargetPos, 0.1)
    camera.lookAt(playerRef.current.position.x, playerRef.current.position.y + 1, playerRef.current.position.z)
  })
}

