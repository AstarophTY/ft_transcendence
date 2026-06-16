import { useFrame } from '@react-three/fiber'
import React, { useMemo } from 'react'
import * as THREE from 'three'

import { usePlanetStore } from '@/store/planetStore.ts'

type useSelectablePlanetAnimationParams = {
  planetRef: React.RefObject<THREE.Group>
  blendRef: React.MutableRefObject<number>
  hovered: boolean
  index: number
  totalCount: number
}

export const useSelectablePlanetAnimation = ({ planetRef, blendRef, hovered, index, totalCount }: useSelectablePlanetAnimationParams) => {
  const baseQuaternion = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, -Math.PI / 4, -0.2, 'YXZ')),
    [],
  )
  const animQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const animEuler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), [])

  useFrame((state) => {
    if (!planetRef.current) return

    const focusedIndex = usePlanetStore.getState().targetOffset * (totalCount - 1)
    const dist = Math.abs(index - focusedIndex)
    const snappedDist = dist < 0.5 ? 0 : dist - 0.5
    const focusFactor = Math.max(0, 1 - snappedDist * 0.5)

    const currentScale = planetRef.current.scale.x
    const targetScale = 0.35 + focusFactor * 0.65
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.3)
    planetRef.current.scale.setScalar(newScale)

    const targetBlend = hovered && focusFactor > 0.5 ? 1 : 0
    blendRef.current = THREE.MathUtils.lerp(blendRef.current, targetBlend, 0.08)

    const t = state.clock.getElapsedTime()
    animEuler.set(Math.sin(t * 0.8) * 0.12 * blendRef.current, Math.cos(t * 0.6) * 0.15 * blendRef.current, 0)
    animQuaternion.setFromEuler(animEuler)

    planetRef.current.quaternion.copy(animQuaternion).multiply(baseQuaternion)
    planetRef.current.position.y = Math.sin(t * 1.2) * 0.05 * blendRef.current
  })
}
