import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { Block } from '@/types/Block'
import { PLAYER_GRAVITY, PLAYER_HEIGHT_OFFSET, PLAYER_JUMP_FORCE } from './config'
import { getGroundHeightAt } from './playerTerrain'
import React from "react";

type Params = {
  active: boolean
  keysRef: React.MutableRefObject<Record<string, boolean>>
  velocityRef: React.MutableRefObject<THREE.Vector3>
  isGroundedRef: React.MutableRefObject<boolean>
  playerRef: React.RefObject<THREE.Group>
  heightMap: Uint16Array
  mapSize: number
  cameraPos: THREE.Vector3
  placedBlocks?: Record<string, Block>
}

export const usePlayerVertical = ({
  active,
  keysRef,
  velocityRef,
  isGroundedRef,
  playerRef,
  heightMap,
  mapSize,
  cameraPos,
  placedBlocks,
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
      heightMap,
      mapSize,
      worldPos: playerRef.current.position,
      cameraPos,
      heightOffset: PLAYER_HEIGHT_OFFSET,
      placedBlocks,
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
