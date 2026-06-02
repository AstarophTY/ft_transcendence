import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import React from "react";

type Params = {
  active: boolean
  camera: THREE.Camera
  playerRef: React.RefObject<THREE.Group>
  controlsRef: React.RefObject<PointerLockControlsImpl>
  keysRef: React.MutableRefObject<Record<string, boolean>>
}

export const usePlayerRotation = ({ active, camera, playerRef, controlsRef, keysRef }: Params) => {
  useFrame((_, delta) => {
    if (!active || !playerRef.current) return

    if (controlsRef.current?.isLocked) {
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)
      direction.y = 0
      direction.normalize()

      if (direction.lengthSq() > 0.1) {
        const targetRotation = Math.atan2(direction.x, direction.z)
        playerRef.current.rotation.y = targetRotation + Math.PI
      }
      return
    }

    if (keysRef.current.ArrowLeft || keysRef.current.KeyQ) playerRef.current.rotation.y += 3 * delta
    if (keysRef.current.ArrowRight || keysRef.current.KeyE) playerRef.current.rotation.y -= 3 * delta
  })
}
