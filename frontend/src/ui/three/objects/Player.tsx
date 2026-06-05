import { PointerLockControls } from '@react-three/drei'
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
import { useAvatar, tintAvatar } from './player/useAvatar'
import { usePlayerAppearance } from './player/playerAppearance'

import type { PlayerProps } from '@/types/Three'
import { Chunk } from '@/types/maps/Chunk'

const Player = ({ localMap, active, playerRef }: PlayerProps) => {
  const { camera, gl } = useThree()
  const skinColor = usePlayerAppearance((s) => s.skinColor)
  const ensureLoaded = usePlayerAppearance((s) => s.ensureLoaded)
  useEffect(() => void ensureLoaded(), [ensureLoaded])
  const { body: scene, eyes } = useAvatar()
  useEffect(() => tintAvatar(scene, skinColor), [scene, skinColor])

  const controlsRef = useRef<PointerLockControlsImpl>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const velocityRef = useRef(new THREE.Vector3())
  const isGroundedRef = useRef(false)

  const mapSize = localMap.widthInChunks * Chunk.WIDTH

  useCurvedSceneMaterials(scene)
  usePlayerInput({ active, domElement: gl.domElement, controlsRef, keysRef })
  usePlayerRotation({ active, camera, playerRef, controlsRef, keysRef })
  usePlayerMovement({ active, camera, playerRef, controlsRef, keysRef, localMap })
  usePlayerVertical({
    active,
    keysRef,
    velocityRef,
    isGroundedRef,
    playerRef,
    localMap,
    cameraPos: camera.position,
  })
  useThirdPersonCamera({ active, camera, playerRef, controlsRef, scene, mapSize, localMap })

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.position.set(0, 20, 0)
    }
  }, [playerRef])

  return (
    <group ref={playerRef}>
      <primitive object={scene} scale={0.5} />
      <primitive object={eyes} scale={0.5} />
      {active && <PointerLockControls ref={controlsRef} selector="#canvas-container" />}
    </group>
  )
}

export default Player
