import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import type { PlanetMap } from '@/models/maps/PlanetMap.ts'
import { usePlanetStore } from '@/store/planetStore.ts'

import PlanetPreviewFaces from './selectablePlanet/PlanetPreviewFaces'
import { useSelectablePlanetAnimation } from './selectablePlanet/useSelectablePlanetAnimation'

interface SelectablePlanetProps {
  map: PlanetMap
  index: number
  totalCount: number
}

const SelectablePlanet = ({ map, index, totalCount }: SelectablePlanetProps) => {
  const planetRef = useRef<THREE.Group>(null)
  const blendRef = useRef(0)
  const [hovered, setHovered] = useState(false)

  useSelectablePlanetAnimation({ planetRef, blendRef, hovered, index, totalCount })

  const factor = 16
  const previewVoxels = useMemo(() => map.getPreview(factor), [map])
  const scale = 1 / factor
  const half = 0.5
  const inset = 0.01

  const minHeight = useMemo(() => {
    if (previewVoxels.length === 0) return 0
    return previewVoxels.reduce((lowest, voxel) => Math.min(lowest, voxel.y), previewVoxels[0]!.y)
  }, [previewVoxels])

  const getHeight = (voxelHeight: number) => Math.max(0, voxelHeight - minHeight) * scale

  return (
    <group ref={planetRef}>
      <mesh
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
          setHovered(true)
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
          setHovered(false)
        }}
        onClick={(e) => {
          e.stopPropagation()
          const storeState = usePlanetStore.getState()
          if (storeState.activeIndex === index) {
            storeState.setSceneMode('zooming')
          } else {
            storeState.setTargetOffset(index / (totalCount - 1))
            storeState.setActiveIndex(index)
          }
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      <PlanetPreviewFaces
        previewVoxels={previewVoxels}
        scale={scale}
        half={half}
        inset={inset}
        getHeight={getHeight}
      />
    </group>
  )
}

export default SelectablePlanet
