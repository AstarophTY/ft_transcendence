import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
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

const tempMatrix = new THREE.Matrix4()
const tempPosition = new THREE.Vector3()
const tempScale = new THREE.Vector3()
const tempColor = new THREE.Color()

const VoxelFace = ({ orientation, previewVoxels, scale, half, inset, getHeight }: Props) => {
  const groupPosition: [number, number, number] =
    orientation === 'top' ? [0, 0.5, 0] : orientation === 'right' ? [0.5, 0, 0] : [0, 0, 0.5]

  const instancedMeshRef = useRef<THREE.InstancedMesh>(null)

  const validVoxels = useMemo(() => {
    return previewVoxels.filter((v) => getHeight(v.y) > 0)
  }, [previewVoxels, getHeight])

  useLayoutEffect(() => {
    if (!instancedMeshRef.current || validVoxels.length === 0) return
    const mesh = instancedMeshRef.current

    validVoxels.forEach((voxel, index) => {
      const voxelHeight = getHeight(voxel.y)

      const common = {
        x: voxel.x * scale - half + scale / 2,
        z: voxel.z * scale - half + scale / 2,
        h: voxelHeight,
      }

      if (orientation === 'top') {
        tempPosition.set(common.x, common.h / 2 - inset, common.z)
        tempScale.set(scale, common.h, scale)
      } else if (orientation === 'right') {
        tempPosition.set(common.h / 2 - inset, common.z, common.x)
        tempScale.set(common.h, scale, scale)
      } else {
        tempPosition.set(common.x, common.z, common.h / 2 - inset)
        tempScale.set(scale, scale, common.h)
      }

      tempMatrix.compose(tempPosition, new THREE.Quaternion(), tempScale)
      mesh.setMatrixAt(index, tempMatrix)

      tempColor.set(voxel.color)
      mesh.setColorAt(index, tempColor)
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [validVoxels, orientation, scale, half, inset])

  if (validVoxels.length === 0) return null

  return (
    <group position={groupPosition}>
      <instancedMesh ref={instancedMeshRef} args={[null as any, null as any, validVoxels.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
      </instancedMesh>
    </group>
  )
}

export default VoxelFace
