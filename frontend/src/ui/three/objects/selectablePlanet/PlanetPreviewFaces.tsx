
import type { PreviewVoxel } from '@/types/maps/PreviewVoxel.ts'

import VoxelFace from './VoxelFace'

type Props = {
  previewVoxels: PreviewVoxel[]
  scale: number
  half: number
  inset: number
  getHeight: (voxelHeight: number) => number
}

const PlanetPreviewFaces = ({ previewVoxels, scale, half, inset, getHeight }: Props) => {
  // The map is e.g. 64x64. The corner is at 32x32.
  // Since `scale` was meant for 64 voxels to fill 1 unit, we now map 32 voxels to fill 1 unit.
  // So the new scale is double.
  const halfRes = 1 / (scale * 2)
  const newScale = scale * 2

  // Top face gets the top-left quadrant of the 2D map
  const topVoxels = previewVoxels
    .filter((v) => v.x < halfRes && v.z < halfRes)
    .map((v) => ({ ...v }))

  // Right face gets the top-right quadrant, folded down the right edge
  const rightVoxels = previewVoxels
    .filter((v) => v.x >= halfRes && v.z < halfRes)
    .map((v) => ({
      ...v,
      x: v.z,
      z: halfRes - 1 - (v.x - halfRes),
    }))

  // Front face gets the bottom-left quadrant, folded down the front edge
  const frontVoxels = previewVoxels
    .filter((v) => v.x < halfRes && v.z >= halfRes)
    .map((v) => ({
      ...v,
      x: v.x,
      z: halfRes - 1 - (v.z - halfRes),
    }))

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
    </>
  )
}

export default PlanetPreviewFaces
