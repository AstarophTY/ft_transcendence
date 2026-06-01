/* eslint-disable react/no-unknown-property */

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'

import { Block } from '../../../models/Block.ts'
import { Chunk } from '../../../models/maps/Chunk.ts'
import { LocalMap } from '../../../models/maps/LocalMap.ts'
import { PlanetMap } from '../../../models/maps/PlanetMap.ts'
import { IslandMap } from '@/perlin/terrain/IslandMap'
import SelectablePlanet from '../objects/SelectablePlanet.tsx'
import { usePlanetStore } from '../../../store/planetStore.ts'

type DemoPlanetProfile = {
  seed: string
  widthInChunks: number
  depthInChunks: number
  scale: number
  octaves: number
  persistence: number
  relief: number
  baseHeight: number
  variationRange: number
}

const PLANET_SPACING = 2.8
const WHEEL_SENSITIVITY = 0.0002

const DEMO_PLANET_PROFILES: DemoPlanetProfile[] = [
  { seed: 'planet-selection-demo-0', widthInChunks: 4, depthInChunks: 4, scale: 0.045, octaves: 4, persistence: 0.45, relief: 0.65, baseHeight: 17, variationRange: 16 },
  { seed: 'planet-selection-demo-1', widthInChunks: 5, depthInChunks: 4, scale: 0.038, octaves: 3, persistence: 0.38, relief: 0.58, baseHeight: 15, variationRange: 14 },
  { seed: 'planet-selection-demo-2', widthInChunks: 4, depthInChunks: 5, scale: 0.052, octaves: 5, persistence: 0.42, relief: 0.72, baseHeight: 19, variationRange: 12 },
  { seed: 'planet-selection-demo-3', widthInChunks: 6, depthInChunks: 4, scale: 0.033, octaves: 4, persistence: 0.5, relief: 0.55, baseHeight: 13, variationRange: 18 },
  { seed: 'planet-selection-demo-4', widthInChunks: 5, depthInChunks: 5, scale: 0.06, octaves: 6, persistence: 0.35, relief: 0.78, baseHeight: 18, variationRange: 10 },
  { seed: 'planet-selection-demo-5', widthInChunks: 4, depthInChunks: 6, scale: 0.041, octaves: 4, persistence: 0.48, relief: 0.62, baseHeight: 16, variationRange: 15 },
  { seed: 'planet-selection-demo-6', widthInChunks: 6, depthInChunks: 5, scale: 0.029, octaves: 5, persistence: 0.4, relief: 0.68, baseHeight: 14, variationRange: 17 },
  { seed: 'planet-selection-demo-7', widthInChunks: 5, depthInChunks: 6, scale: 0.055, octaves: 3, persistence: 0.52, relief: 0.52, baseHeight: 20, variationRange: 11 },
  { seed: 'planet-selection-demo-8', widthInChunks: 4, depthInChunks: 4, scale: 0.047, octaves: 6, persistence: 0.36, relief: 0.74, baseHeight: 18, variationRange: 13 },
  { seed: 'planet-selection-demo-9', widthInChunks: 6, depthInChunks: 6, scale: 0.036, octaves: 4, persistence: 0.43, relief: 0.6, baseHeight: 15, variationRange: 16 },
]

const createDemoPlanetMap = (profile: DemoPlanetProfile) => {
  const continent = new LocalMap(profile.widthInChunks, profile.depthInChunks)
  const islandMap = new IslandMap({
    seed: profile.seed,
    mapSize: Math.max(profile.widthInChunks, profile.depthInChunks) * Chunk.WIDTH,
    maxHeight: Chunk.HEIGHT - 1,
    scale: profile.scale,
    octaves: profile.octaves,
    persistence: profile.persistence,
    relief: profile.relief,
    baseHeight: profile.baseHeight,
    variationRange: profile.variationRange,
  })

  for (let chunkX = 0; chunkX < continent.widthInChunks; chunkX += 1) {
    for (let chunkZ = 0; chunkZ < continent.depthInChunks; chunkZ += 1) {
      const chunk = new Chunk()

      for (let x = 0; x < Chunk.WIDTH; x += 1) {
        for (let z = 0; z < Chunk.WIDTH; z += 1) {
          const worldX = chunkX * Chunk.WIDTH + x
          const worldZ = chunkZ * Chunk.WIDTH + z
          const height = islandMap.getHeightAt(worldX, worldZ)

          for (let y = 0; y <= height; y += 1) {
            chunk.setBlock(x, y, z, Block.Stone)
          }
        }
      }

      continent.setChunk(chunkX, chunkZ, chunk)
    }
  }

  return new PlanetMap(continent)
}

const PlanetRail = ({
  planetMaps,
}: {
  planetMaps: PlanetMap[]
}) => {
  const railRef = useRef<THREE.Group>(null)
  const totalSpan = (planetMaps.length - 1) * PLANET_SPACING

  useFrame((_, delta) => {
    if (!railRef.current) {
      return
    }

    const { targetOffset } = usePlanetStore.getState()
    const targetX = (0.5 - targetOffset) * totalSpan
    railRef.current.position.x = THREE.MathUtils.lerp(railRef.current.position.x, targetX, delta * 6)
  })

  return (
    <group ref={railRef}>
      {planetMaps.map((planetMap, index) => (
        <group
          key={index}
          position={[(index - ((planetMaps.length - 1) / 2)) * PLANET_SPACING, 0, 0]}
        >
          <SelectablePlanet map={planetMap} wheelOffset={wheelOffset} index={index} totalCount={planetMaps.length} />
        </group>
      ))}
    </group>
  )
}

const PlanetSelectionScene = () => {
  const planetMaps = useMemo(
    () => DEMO_PLANET_PROFILES.map((profile) => createDemoPlanetMap(profile)),
    [],
  )

  useEffect(() => {
    usePlanetStore.setState({ planetCount: planetMaps.length })
  }, [planetMaps.length])

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX
      const currentOffset = usePlanetStore.getState().targetOffset
      const newOffset = THREE.MathUtils.clamp(
        currentOffset + delta * WHEEL_SENSITIVITY,
        0,
        1,
      )
      
      const newIndex = Math.round(newOffset * (planetMaps.length - 1))
      usePlanetStore.setState({ 
        targetOffset: newOffset,
        activeIndex: newIndex
      })
    }

    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [planetMaps.length])

  return (
    <PlanetRail planetMaps={planetMaps} />
  )
}

export default PlanetSelectionScene
