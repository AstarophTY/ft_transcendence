import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import { Chunk } from '@/types/maps/Chunk'
import { LocalMap } from '@/types/maps/LocalMap'
import { PLAYER_SPEED } from './config'
import { checkCollisionAt } from './playerCollision'
import React from "react";
import { useEditorStore } from '@/store/editorStore'

type Params = {
  active: boolean
  camera: THREE.Camera
  playerRef: React.RefObject<THREE.Group>
  controlsRef: React.RefObject<PointerLockControlsImpl>
  keysRef: React.MutableRefObject<Record<string, boolean>>
  localMap: LocalMap
}

export const usePlayerMovement = ({ active, camera, playerRef, controlsRef, keysRef, localMap }: Params) => {
  const setClaimZone = useEditorStore((s) => s.setClaimZone)
  const inClaim = useEditorStore((s) => s.inClaimZone)
  useFrame((_, delta) => {
    if (!active || !playerRef.current) return
    const moveVector = new THREE.Vector3()
    if (keysRef.current.KeyW) moveVector.z -= 1
    if (keysRef.current.KeyS) moveVector.z += 1
    if (keysRef.current.KeyA) moveVector.x -= 1
    if (keysRef.current.KeyD) moveVector.x += 1

    if (moveVector.lengthSq() === 0) return

    moveVector.normalize()

    let forward: THREE.Vector3
    let right: THREE.Vector3

    if (controlsRef.current?.isLocked) {
      forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()
    } else {
      forward = new THREE.Vector3(0, 0, -1).applyQuaternion(playerRef.current.quaternion)
      right = new THREE.Vector3(1, 0, 0).applyQuaternion(playerRef.current.quaternion)
    }

    const direction = new THREE.Vector3()
      .addScaledVector(forward, -moveVector.z)
      .addScaledVector(right, moveVector.x)
      .normalize()

    const nextX = playerRef.current.position.x + direction.x * PLAYER_SPEED * delta
    const nextZ = playerRef.current.position.z + direction.z * PLAYER_SPEED * delta

    const hit = (x: number, z: number) =>
      checkCollisionAt({
        x,
        z,
        playerY: playerRef.current!.position.y,
        localMap,
      })

    if (!hit(nextX, nextZ)) {
      playerRef.current.position.x = nextX
      playerRef.current.position.z = nextZ
    } else if (!hit(nextX, playerRef.current.position.z)) {
      playerRef.current.position.x = nextX
    } else if (!hit(playerRef.current.position.x, nextZ)) {
      playerRef.current.position.z = nextZ
    }
    const pX = Math.floor(playerRef.current.position.x / Chunk.WIDTH);
    const pZ = Math.floor(playerRef.current.position.z / Chunk.WIDTH);
    if (pX >= -2 && pX < 2 && pZ >= -2 && pZ < 2) {
      if (!inClaim) setClaimZone(true)
    } else if (inClaim) {
      setClaimZone(false)
    }
  })
}
