import { useMemo } from 'react'
import type { PreviewVoxel } from '@/types/maps/previewVoxel.ts'

import VoxelFace from '@/ui/three/objects/selectablePlanet/VoxelFace'
import VoxelFiller from '@/ui/three/objects/selectablePlanet/VoxelFiller'
import { useFillerVoxels } from '@/ui/three/objects/selectablePlanet/useFillerVoxels'

type PlanetPreviewFacesProps = {
  previewVoxels: PreviewVoxel[]
  scale: number
  half: number
  inset: number
  getHeight: (voxelHeight: number) => number
}

const PlanetPreviewFaces = ({ previewVoxels, scale, half, inset, getHeight }: PlanetPreviewFacesProps) => {
  const halfRes = 1 / (scale * 2)
  const newScale = scale * 2

  // Top face gets the top-left quadrant of the 2D map
  const topVoxels = useMemo(() => {
    return previewVoxels
      .filter((v) => v.x < halfRes && v.z < halfRes)
      .map((v) => ({ ...v }))
  }, [previewVoxels, halfRes])

  // Right face gets the top-right quadrant, folded down the right edge
  const rightVoxels = useMemo(() => {
    return previewVoxels
      .filter((v) => v.x >= halfRes && v.z < halfRes)
      .map((v) => ({
        ...v,
        x: v.z,
        z: halfRes - 1 - (v.x - halfRes),
      }))
  }, [previewVoxels, halfRes])

  // Front face gets the bottom-left quadrant, folded down the front edge
  const frontVoxels = useMemo(() => {
    return previewVoxels
      .filter((v) => v.x < halfRes && v.z >= halfRes)
      .map((v) => ({
        ...v,
        x: v.x,
        z: halfRes - 1 - (v.z - halfRes),
      }))
  }, [previewVoxels, halfRes])

  const fillerVoxels = useFillerVoxels({
    previewVoxels,
    newScale,
    half,
    inset,
    getHeight,
  })

  return (
    <>
      <VoxelFace
        orientation="top"
        previewVoxels={topVoxels}
        scale={newScale}
        half={half}
        inset={inset}
        getHeight={getHeight}
        keyPrefix="top"
      />
      <VoxelFace
        orientation="right"
        previewVoxels={rightVoxels}
        scale={newScale}
        half={half}
        inset={inset}
        getHeight={getHeight}
        keyPrefix="right"
      />
      <VoxelFace
        orientation="front"
        previewVoxels={frontVoxels}
        scale={newScale}
        half={half}
        inset={inset}
        getHeight={getHeight}
        keyPrefix="front"
      />

      <VoxelFiller fillerVoxels={fillerVoxels} newScale={newScale} />
    </>
  )
}

export default PlanetPreviewFaces
