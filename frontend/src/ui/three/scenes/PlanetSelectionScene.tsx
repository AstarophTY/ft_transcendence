import * as THREE from 'three'
import { useEffect, useMemo } from 'react'

import { usePlanetStore } from '@/store/planetStore.ts'

import { WHEEL_SENSITIVITY } from './planetSelection/constants'
import { DEMO_PLANET_PROFILES } from './planetSelection/demoPlanetProfiles'
import { createDemoPlanetMap } from './planetSelection/createDemoPlanetMap'
import PlanetRail from './planetSelection/PlanetRail'

const PlanetSelectionScene = () => {
  const planetMaps = useMemo(() => DEMO_PLANET_PROFILES.map(createDemoPlanetMap), [])

  useEffect(() => {
    usePlanetStore.setState({ planetCount: planetMaps.length })
  }, [planetMaps.length])

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
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

  return <PlanetRail planetMaps={planetMaps} />
}

export default PlanetSelectionScene
