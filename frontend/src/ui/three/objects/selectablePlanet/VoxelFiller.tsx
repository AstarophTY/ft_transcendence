import * as THREE from 'three'
import { useLayoutEffect, useRef, ElementType } from 'react'
import type { FillerVoxel } from './fillerTypes'

const InstancedMesh = 'instancedMesh' as unknown as ElementType
const BoxGeometry = 'boxGeometry' as unknown as ElementType

type Props = {
  fillerVoxels: FillerVoxel[]
  newScale: number
}

const VoxelFiller = ({ fillerVoxels, newScale }: Props) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!instancedMeshRef.current || fillerVoxels.length === 0) return
    const mesh = instancedMeshRef.current

    const tempMatrix = new THREE.Matrix4()
    const tempPosition = new THREE.Vector3()
    const tempScale = new THREE.Vector3(newScale, newScale, newScale)
    const tempColor = new THREE.Color()
    const quaternion = new THREE.Quaternion()

    fillerVoxels.forEach((voxel, index) => {
      tempPosition.set(voxel.x, voxel.y, voxel.z)
      tempMatrix.compose(tempPosition, quaternion, tempScale)
      mesh.setMatrixAt(index, tempMatrix)

      tempColor.set(voxel.color)
      mesh.setColorAt(index, tempColor)
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [fillerVoxels, newScale])

  if (fillerVoxels.length === 0) return null

  return (
    <InstancedMesh
      ref={instancedMeshRef}
      args={[null as unknown as THREE.BufferGeometry, null as unknown as THREE.Material, fillerVoxels.length]}
    >
      <BoxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial />
    </InstancedMesh>
  )
}

export default VoxelFiller
