import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'

import { PLAYER_BOUNDARY_PADDING } from './config'
import { updateCurvatureUniforms } from '@/ui/three/utils/curvature'
import React from "react";

type Params = {
  active: boolean
  camera: THREE.Camera
  playerRef: React.RefObject<THREE.Group>
  controlsRef: React.RefObject<PointerLockControlsImpl>
  scene: THREE.Object3D
  mapSize: number
}

export const useThirdPersonCamera = ({ active, camera, playerRef, controlsRef, scene, mapSize }: Params) => {
  useFrame(() => {
    if (!playerRef.current) return

    // Map boundaries (kept with camera pass to match original behavior)
    const halfSize = mapSize / 2
    playerRef.current.position.x = THREE.MathUtils.clamp(playerRef.current.position.x, -halfSize + PLAYER_BOUNDARY_PADDING, halfSize - PLAYER_BOUNDARY_PADDING)
    playerRef.current.position.z = THREE.MathUtils.clamp(playerRef.current.position.z, -halfSize + PLAYER_BOUNDARY_PADDING, halfSize - PLAYER_BOUNDARY_PADDING)

    if (!active) return

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        updateCurvatureUniforms((child as THREE.Mesh).material, camera)
      }
    })

    if (controlsRef.current?.isLocked) {
      const distance = 10
      const height = 1

      const offset = new THREE.Vector3(0, 0, distance)
      offset.applyQuaternion(camera.quaternion)

      camera.position.set(
        playerRef.current.position.x + offset.x,
        playerRef.current.position.y + height + offset.y,
        playerRef.current.position.z + offset.z,
      )
      return
    }

    const idealOffset = new THREE.Vector3(0, 5, 10)
    idealOffset.applyQuaternion(playerRef.current.quaternion)
    idealOffset.add(playerRef.current.position)

    camera.position.lerp(idealOffset, 0.1)
    camera.lookAt(playerRef.current.position.x, playerRef.current.position.y + 1, playerRef.current.position.z)
  })
}
