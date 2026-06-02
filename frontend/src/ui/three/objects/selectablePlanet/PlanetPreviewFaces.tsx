
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
  return (
    <>
      <VoxelFace
        orientation="top"
        previewVoxels={previewVoxels}
        scale={scale}
        half={half}
        inset={inset}
        getHeight={getHeight}
        keyPrefix="top"
      />
      <VoxelFace
        orientation="right"
        previewVoxels={previewVoxels}
        scale={scale}
        half={half}
        inset={inset}
        getHeight={getHeight}
        keyPrefix="right"
      />
      <VoxelFace
        orientation="front"
        previewVoxels={previewVoxels}
        scale={scale}
        half={half}
        inset={inset}
        getHeight={getHeight}
        keyPrefix="front"
      />
    </>
  )
}

export default PlanetPreviewFaces
