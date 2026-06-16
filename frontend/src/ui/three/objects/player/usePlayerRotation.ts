import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import React from "react";

type usePlayerRotationParams = {
  active: boolean
  camera: THREE.Camera
  playerRef: React.RefObject<THREE.Group>
  controlsRef: React.RefObject<PointerLockControlsImpl>
  keysRef: React.MutableRefObject<Record<string, boolean>>
}

export const usePlayerRotation = ({ active, camera, playerRef, controlsRef, keysRef }: usePlayerRotationParams) => {
  useFrame((_, delta) => {
    if (!active || !playerRef.current) return

    if (controlsRef.current?.isLocked) {
      const isMoving = keysRef.current.KeyW || keysRef.current.KeyS || keysRef.current.KeyA || keysRef.current.KeyD;
      if (isMoving) {
        const moveX = (keysRef.current.KeyD ? 1 : 0) - (keysRef.current.KeyA ? 1 : 0);
        const moveZ = (keysRef.current.KeyS ? 1 : 0) - (keysRef.current.KeyW ? 1 : 0);

        if (moveX !== 0 || moveZ !== 0) {
          const forward = new THREE.Vector3()
          camera.getWorldDirection(forward)
          forward.y = 0
          forward.normalize()

          const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()

          const direction = new THREE.Vector3()
            .addScaledVector(forward, -moveZ)
            .addScaledVector(right, moveX)
            .normalize()

          const targetRotation = Math.atan2(direction.x, direction.z) + Math.PI
          const diff = THREE.MathUtils.euclideanModulo(targetRotation - playerRef.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI
          playerRef.current.rotation.y += diff * Math.min(1, delta * 10)
        }
      }
      return
    }

    if (keysRef.current.ArrowLeft || keysRef.current.KeyQ) playerRef.current.rotation.y += 3 * delta
    if (keysRef.current.ArrowRight || keysRef.current.KeyE) playerRef.current.rotation.y -= 3 * delta
  })
}
