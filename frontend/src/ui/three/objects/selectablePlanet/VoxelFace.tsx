
import type { PreviewVoxel } from '@/types/maps/PreviewVoxel.ts'

type Orientation = 'top' | 'right' | 'front'

type Props = {
  orientation: Orientation
  previewVoxels: PreviewVoxel[]
  scale: number
  half: number
  inset: number
  getHeight: (voxelHeight: number) => number
  keyPrefix: string
}

const VoxelFace = ({ orientation, previewVoxels, scale, half, inset, getHeight, keyPrefix }: Props) => {
  const groupPosition: [number, number, number] =
    orientation === 'top' ? [0, 0.5, 0] : orientation === 'right' ? [0.5, 0, 0] : [0, 0, 0.5]

  return (
    <group position={groupPosition}>
      {previewVoxels.map((voxel, index) => {
        const color = voxel.color
        const voxelHeight = getHeight(voxel.y)
        if (voxelHeight <= 0) return null

        const common = {
          x: voxel.x * scale - half + scale / 2,
          z: voxel.z * scale - half + scale / 2,
          h: voxelHeight,
        }

        const position: [number, number, number] =
          orientation === 'top'
            ? [common.x, common.h / 2 - inset, common.z]
            : orientation === 'right'
              ? [common.h / 2 - inset, common.z, common.x]
              : [common.x, common.z, common.h / 2 - inset]

        const boxArgs: [number, number, number] =
          orientation === 'top'
            ? [scale, common.h, scale]
            : orientation === 'right'
              ? [common.h, scale, scale]
              : [scale, scale, common.h]

        return (
          <mesh key={`${keyPrefix}-${index}`} position={position}>
            <boxGeometry args={boxArgs} />
            <meshStandardMaterial color={color} />
          </mesh>
        )
      })}
    </group>
  )
}

export default VoxelFace
