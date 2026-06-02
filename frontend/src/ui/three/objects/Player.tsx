import { PointerLockControls, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'

import { useCurvedSceneMaterials } from './player/useCurvedSceneMaterials'
import { usePlayerInput } from './player/usePlayerInput'
import { usePlayerMovement } from './player/usePlayerMovement'
import { usePlayerRotation } from './player/usePlayerRotation'
import { usePlayerVertical } from './player/usePlayerVertical'
import { useThirdPersonCamera } from './player/useThirdPersonCamera'

import type { PlayerProps } from './player/types'

const Player = ({ heightMap, mapSize, active, playerRef }: PlayerProps) => {
  const { camera, gl } = useThree()
  const { scene } = useGLTF('/three/assets/capsule/full_bodie/Body_AA_01.glb')

  const controlsRef = useRef<PointerLockControlsImpl>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const velocityRef = useRef(new THREE.Vector3())
  const isGroundedRef = useRef(false)

  useCurvedSceneMaterials(scene)
  usePlayerInput({ active, domElement: gl.domElement, controlsRef, keysRef })
  usePlayerRotation({ active, camera, playerRef, controlsRef, keysRef })
  usePlayerMovement({ active, camera, playerRef, controlsRef, keysRef, heightMap, mapSize })
  usePlayerVertical({
    active,
    keysRef,
    velocityRef,
    isGroundedRef,
    playerRef,
    heightMap,
    mapSize,
    cameraPos: camera.position,
  })
  useThirdPersonCamera({ active, camera, playerRef, controlsRef, scene, mapSize })

  useEffect(() => {
    playerRef.current?.position.set(0, 20, 0)
  }, [playerRef])

  return (
    <group ref={playerRef}>
      <primitive object={scene} scale={0.5} />
      {active && <PointerLockControls ref={controlsRef} />}
    </group>
  )
}

export default Player
