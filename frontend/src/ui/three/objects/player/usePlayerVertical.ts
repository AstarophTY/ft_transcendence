import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { LocalMap } from '@/types/maps/LocalMap'
import { PLAYER_GRAVITY, PLAYER_HEIGHT_OFFSET, PLAYER_JUMP_FORCE } from './config'
import { getGroundHeightAt } from './playerTerrain'
import React from "react";

type Params = {
  active: boolean
  keysRef: React.MutableRefObject<Record<string, boolean>>
  velocityRef: React.MutableRefObject<THREE.Vector3>
  isGroundedRef: React.MutableRefObject<boolean>
  playerRef: React.RefObject<THREE.Group>
  localMap: LocalMap
  cameraPos: THREE.Vector3
}

export const usePlayerVertical = ({
  active,
  keysRef,
  velocityRef,
  isGroundedRef,
  playerRef,
  localMap,
  cameraPos,
}: Params) => {
  useFrame((_, delta) => {
    if (!playerRef.current) return

    if (active && keysRef.current.Space && isGroundedRef.current) {
      velocityRef.current.y = PLAYER_JUMP_FORCE
      isGroundedRef.current = false
    }

    velocityRef.current.y -= PLAYER_GRAVITY * delta
    playerRef.current.position.y += velocityRef.current.y * delta

    const groundHeight = getGroundHeightAt({
      localMap,
      worldPos: playerRef.current.position,
      cameraPos,
      heightOffset: PLAYER_HEIGHT_OFFSET,
    })

    if (playerRef.current.position.y <= groundHeight) {
      playerRef.current.position.y = groundHeight
      velocityRef.current.y = 0
      isGroundedRef.current = true
    } else {
      isGroundedRef.current = false
    }
  })
}
