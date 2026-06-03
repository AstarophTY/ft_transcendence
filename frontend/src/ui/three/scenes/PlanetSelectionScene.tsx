import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo } from 'react'

import { usePlanetStore } from '@/store/planetStore.ts'

import { WHEEL_SENSITIVITY } from './planetSelection/constants'
import { DEMO_PLANET_PROFILES } from './planetSelection/demoPlanetProfiles'
import { createDemoPlanetMap } from './planetSelection/createDemoPlanetMap'
import PlanetRail from './planetSelection/PlanetRail'

const CameraController = () => {
  const { camera } = useThree()

  useFrame((_, delta) => {
    const sceneMode = usePlanetStore.getState().sceneMode
    if (sceneMode === 'zooming') {
      const targetPos = new THREE.Vector3(0, 0.5, 0.5)
      camera.position.lerp(targetPos, delta * 5)

      if (camera.position.distanceTo(targetPos) < 0.1) {
        usePlanetStore.getState().setSceneMode('world')
      }
    } else if (sceneMode === 'selection') {
      const defaultPos = new THREE.Vector3(0, 1.5, 4)
      camera.position.lerp(defaultPos, delta * 5)
    }
  })

  return null
}

const PlanetSelectionScene = () => {
  const planetMaps = useMemo(() => DEMO_PLANET_PROFILES.map(createDemoPlanetMap), [])

  useEffect(() => {
    usePlanetStore.setState({ planetCount: planetMaps.length })
  }, [planetMaps.length])

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (usePlanetStore.getState().sceneMode !== 'selection') return;
      event.preventDefault()

      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX
      const currentOffset = usePlanetStore.getState().targetOffset
      const newOffset = THREE.MathUtils.clamp(currentOffset + delta * WHEEL_SENSITIVITY, 0, 1)
      const newIndex = Math.round(newOffset * (planetMaps.length - 1))

      usePlanetStore.setState({ targetOffset: newOffset, activeIndex: newIndex })
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [planetMaps.length])

  return (
    <>
      <CameraController />
      <PlanetRail planetMaps={planetMaps} />
    </>
  )
}

export default PlanetSelectionScene
