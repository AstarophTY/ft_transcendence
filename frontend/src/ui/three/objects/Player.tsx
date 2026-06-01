import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface PlayerProps {
  heightMap: Uint16Array
  mapSize: number
  active: boolean
}

export const Player = ({ heightMap, mapSize, active }: PlayerProps) => {
  const { camera } = useThree()
  const { scene } = useGLTF('/three/assets/capsule/full_bodie/Body_AA_01.glb')
  
  const playerRef = useRef<THREE.Group>(null)
  const velocity = useRef(new THREE.Vector3())
  const isGrounded = useRef(false)
  
  const keys = useRef<Record<string, boolean>>({})
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true }
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Initial pos
  useEffect(() => {
    if (playerRef.current) {
        playerRef.current.position.set(0, 20, 0)
    }
  }, [])

  useFrame((state, delta) => {
    if (!playerRef.current) return

    const speed = 10
    const jumpForce = 12
    const gravity = 30
    const halfSize = mapSize / 2

    // Player rotation
    if (active) {
      if (keys.current['ArrowLeft'] || keys.current['KeyQ']) playerRef.current.rotation.y += 3 * delta
      if (keys.current['ArrowRight'] || keys.current['KeyE']) playerRef.current.rotation.y -= 3 * delta
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

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(playerRef.current.quaternion)
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(playerRef.current.quaternion)
      
      const direction = new THREE.Vector3()
        .addScaledVector(forward, -moveVector.z)
        .addScaledVector(right, moveVector.x)
        .normalize()

      playerRef.current.position.addScaledVector(direction, speed * delta)
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
    const groundHeight = heightMap[mapIndex] ?? 0

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
      const idealOffset = new THREE.Vector3(0, 5, 10)
      idealOffset.applyQuaternion(playerRef.current.quaternion)
      idealOffset.add(playerRef.current.position)

      const idealLookat = new THREE.Vector3(0, 2, -5)
      idealLookat.applyQuaternion(playerRef.current.quaternion)
      idealLookat.add(playerRef.current.position)

      camera.position.lerp(idealOffset, 0.1)
      camera.lookAt(playerRef.current.position.x, playerRef.current.position.y + 2, playerRef.current.position.z)
    }
  })

  return (
    <group ref={playerRef}>
      <primitive object={scene} scale={1} />
    </group>
  )
}
