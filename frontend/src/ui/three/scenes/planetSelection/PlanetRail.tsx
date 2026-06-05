import { useFrame } from '@react-three/fiber'
import type { PlanetMap } from '@/types/maps/PlanetMap.ts'
import { useRef } from 'react'
import * as THREE from 'three'

import { usePlanetStore } from '@/store/planetStore.ts'

import SelectablePlanet from '../../objects/SelectablePlanet'
import { PLANET_SPACING } from './constants'

const PlanetRail = ({ planetMaps }: { planetMaps: PlanetMap[] }) => {
  const railRef = useRef<THREE.Group>(null)
  const totalSpan = (planetMaps.length - 1) * PLANET_SPACING

  useFrame((_, delta) => {
    if (!railRef.current) return

    const { targetOffset, activeIndex } = usePlanetStore.getState()
    const targetX = (0.5 - targetOffset) * totalSpan
    railRef.current.position.x = THREE.MathUtils.lerp(railRef.current.position.x, targetX, delta * 8)

    railRef.current.children.forEach((child, index) => {
      const dist = Math.abs(index - activeIndex)
      const targetZ = -dist * 1.5
      const targetY = -Math.pow(dist, 1.2) * 0.3
      child.position.z = THREE.MathUtils.lerp(child.position.z, targetZ, delta * 6)
      child.position.y = THREE.MathUtils.lerp(child.position.y, targetY, delta * 6)
    })
  })

  return (
    <group ref={railRef}>
      {planetMaps.map((planetMap, index) => (
        <group
          key={index}
          position={[(index - (planetMaps.length - 1) / 2) * PLANET_SPACING, 0, 0]}
        >
          <SelectablePlanet map={planetMap} index={index} totalCount={planetMaps.length} />
        </group>
      ))}
    </group>
  )
}

export default PlanetRail
