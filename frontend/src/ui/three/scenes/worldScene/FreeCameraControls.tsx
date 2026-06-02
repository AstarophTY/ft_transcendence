import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'

import { getCurvatureOffset } from '../../utils/curvature'

interface FreeCameraControlsProps {
  heightMap: Uint16Array
  mapSize: number
  active: boolean
  playerRef: React.RefObject<THREE.Group>
}

export const FreeCameraControls = ({
  heightMap,
  mapSize,
  active,
  playerRef,
}: FreeCameraControlsProps) => {
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
      if (active && event.code === 'ControlLeft') {
        controlsRef.current?.unlock()
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.code] = false
    }
    const handleClick = (e: MouseEvent) => {
      if (active && e.target === gl.domElement) {
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
      const rawGroundHeight = heightMap[mapIndex] ?? 0
      const curvatureOffset = getCurvatureOffset(pos, camera.position)
      const groundHeight = rawGroundHeight - curvatureOffset
      // The block occupies space from groundHeight to groundHeight + 1
      // We are inside a block if our y is between groundHeight and groundHeight + 1
      const isInsideBlockVolume = pos.y >= groundHeight && pos.y <= groundHeight + 1
      return !isInsideBlockVolume
    }

    // Collision handling: check each axis separately for sliding
    const finalPosition = camera.position.clone()

    const getPhysicGroundHeight = (pos: THREE.Vector3) => {
      const mapX = Math.floor(pos.x + halfSize)
      const mapZ = Math.floor(pos.z + halfSize)
      const mapIndex = THREE.MathUtils.clamp(mapZ, 0, mapSize - 1) * mapSize + THREE.MathUtils.clamp(mapX, 0, mapSize - 1)
      const rawGroundHeight = heightMap[mapIndex] ?? 0
      const curvatureOffset = getCurvatureOffset(pos, camera.position)
      return rawGroundHeight - curvatureOffset
    }

    // Try vertical movement first
    const verticalPos = finalPosition.clone()
    verticalPos.y = nextPosition.y
    if (isValidPosition(verticalPos)) {
      finalPosition.y = nextPosition.y
    } else {
      // If moving into a block volume from above, snap to top
      const groundHeight = getPhysicGroundHeight(finalPosition)

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

  return active ? <PointerLockControls ref={(node) => { controlsRef.current = node }} selector="#canvas-container" /> : null
}
