import { useGLTF, PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'

interface PlayerProps {
  heightMap: Uint16Array
  mapSize: number
  active: boolean
  playerRef: React.RefObject<THREE.Group>
}

const Player = ({ heightMap, mapSize, active, playerRef }: PlayerProps) => {
  const { camera, gl } = useThree()
  const { scene } = useGLTF('/three/assets/capsule/full_bodie/Body_AA_01.glb')
  
  const controlsRef = useRef<PointerLockControlsImpl>(null)
  const velocity = useRef(new THREE.Vector3())
  const isGrounded = useRef(false)
  
  const keys = useRef<Record<string, boolean>>({})
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true }
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false }
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
  }, [active, gl.domElement])

  // Initial pos
  useEffect(() => {
    if (playerRef.current) {
        playerRef.current.position.set(0, 20, 0)
    }
  }, [playerRef])

  useFrame((_state, delta) => {
    if (!playerRef.current) return

    const speed = 10
    const jumpForce = 10
    const gravity = 30
    const halfSize = mapSize / 2
    const playerHeightOffset = 1.1

    // Player rotation
    if (active) {
      if (controlsRef.current?.isLocked) {
        // Handle rotation via mouse (PointerLockControls already handles camera, 
        // but we need to rotate the player mesh to match horizontal rotation)
        const direction = new THREE.Vector3()
        camera.getWorldDirection(direction)
        direction.y = 0
        direction.normalize()
        
        if (direction.lengthSq() > 0.1) {
          const targetRotation = Math.atan2(direction.x, direction.z)
          playerRef.current.rotation.y = targetRotation + Math.PI
        }
      } else {
        if (keys.current['ArrowLeft'] || keys.current['KeyQ']) playerRef.current.rotation.y += 3 * delta
        if (keys.current['ArrowRight'] || keys.current['KeyE']) playerRef.current.rotation.y -= 3 * delta
      }
    }

    // Horizontal movement
    const moveVector = new THREE.Vector3()
    if (active) {
        if (keys.current['KeyW']) moveVector.z -= 1
        if (keys.current['KeyS']) moveVector.z += 1
        if (keys.current['KeyA']) moveVector.x -= 1
        if (keys.current['KeyD']) moveVector.x += 1
    }

    if (moveVector.length() > 0) {
      moveVector.normalize()

      let forward, right;
      
      if (active && controlsRef.current?.isLocked) {
        // Pointer lock mode: move relative to camera
        forward = new THREE.Vector3()
        camera.getWorldDirection(forward)
        forward.y = 0
        forward.normalize()
        right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()
      } else {
        // Classic mode
        forward = new THREE.Vector3(0, 0, -1).applyQuaternion(playerRef.current.quaternion)
        right = new THREE.Vector3(1, 0, 0).applyQuaternion(playerRef.current.quaternion)
      }

      const direction = new THREE.Vector3()
        .addScaledVector(forward, -moveVector.z)
        .addScaledVector(right, moveVector.x)
        .normalize()

      const nextX = playerRef.current.position.x + direction.x * speed * delta
      const nextZ = playerRef.current.position.z + direction.z * speed * delta

      const checkCollision = (x: number, z: number) => {
        const radius = 0.2
        const points = [
          { x: x + radius, z: z + radius },
          { x: x + radius, z: z - radius },
          { x: x - radius, z: z + radius },
          { x: x - radius, z: z - radius },
        ]

        for (const p of points) {
          const pMapX = Math.floor(p.x + halfSize)
          const pMapZ = Math.floor(p.z + halfSize)
          const pMapIndex = THREE.MathUtils.clamp(pMapZ, 0, mapSize - 1) * mapSize + THREE.MathUtils.clamp(pMapX, 0, mapSize - 1)
          const pGroundHeight = (heightMap[pMapIndex] ?? 0) + playerHeightOffset
          
          if (playerRef.current && pGroundHeight > playerRef.current.position.y + 0.5) {
            return true
          }
        }
        return false
      }

      // Independent X and Z movement to allow sliding along walls
      if (!checkCollision(nextX, nextZ)) {
        playerRef.current.position.x = nextX
        playerRef.current.position.z = nextZ
      } else {
        // Try X only
        if (!checkCollision(nextX, playerRef.current.position.z)) {
          playerRef.current.position.x = nextX
        }
        // Try Z only
        else if (!checkCollision(playerRef.current.position.x, nextZ)) {
          playerRef.current.position.z = nextZ
        }
      }
    }

    // Gravity and jump
    if (active && keys.current['Space'] && isGrounded.current) {
      velocity.current.y = jumpForce
      isGrounded.current = false
    }

    velocity.current.y -= gravity * delta
    playerRef.current.position.y += velocity.current.y * delta

    // Collision with the ground (heightMap)
    const mapX = Math.floor(playerRef.current.position.x + halfSize)
    const mapZ = Math.floor(playerRef.current.position.z + halfSize)
    const mapIndex = THREE.MathUtils.clamp(mapZ, 0, mapSize - 1) * mapSize + THREE.MathUtils.clamp(mapX, 0, mapSize - 1)
    const groundHeight = (heightMap[mapIndex] ?? 0) + playerHeightOffset

    if (playerRef.current.position.y <= groundHeight) {
      playerRef.current.position.y = groundHeight
      velocity.current.y = 0
      isGrounded.current = true
    } else {
      isGrounded.current = false
    }

    // Map boundaries
    playerRef.current.position.x = THREE.MathUtils.clamp(playerRef.current.position.x, -halfSize + 0.5, halfSize - 0.5)
    playerRef.current.position.z = THREE.MathUtils.clamp(playerRef.current.position.z, -halfSize + 0.5, halfSize - 0.5)

    // TPS Camera
    if (active) {
      if (controlsRef.current?.isLocked) {
        // Pointer lock mode: camera follows the player at a certain distance
        const distance = 10
        const height = 1 // Eye level / view center (reduced by 20% from 2)
        
        // Calculate target position: behind the player relative to current camera orientation
        const offset = new THREE.Vector3(0, 0, distance)
        offset.applyQuaternion(camera.quaternion)
        
        const targetPos = new THREE.Vector3(
          playerRef.current.position.x + offset.x,
          playerRef.current.position.y + height + offset.y,
          playerRef.current.position.z + offset.z
        )
        
        camera.position.copy(targetPos)
        // Note: No lookAt here as PointerLockControls already handles rotation.
      } else {
        const idealOffset = new THREE.Vector3(0, 5, 10)
        idealOffset.applyQuaternion(playerRef.current.quaternion)
        idealOffset.add(playerRef.current.position)

        const idealLookat = new THREE.Vector3(0, 1, -5)
        idealLookat.applyQuaternion(playerRef.current.quaternion)
        idealLookat.add(playerRef.current.position)

        camera.position.lerp(idealOffset, 0.1)
        camera.lookAt(playerRef.current.position.x, playerRef.current.position.y + 1, playerRef.current.position.z)
      }
    }
  })

  return (
    <group ref={playerRef}>
      <primitive object={scene} scale={0.5} />
      {active && <PointerLockControls ref={controlsRef} />}
    </group>
  )
}
export default Player
