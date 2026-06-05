import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'

import { BODY_MODEL_PATH, EYES_MODEL_PATH } from '@/config/playerAppearance'

/** Clone a GLTF scene with its own (cloned) materials so it can be tinted
 * independently of every other avatar that shares the cached source. */
const cloneWithOwnMaterials = (source: THREE.Object3D): THREE.Group => {
  const clone = SkeletonUtils.clone(source) as THREE.Group
  clone.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map((m) => m.clone())
      : mesh.material.clone()
  })
  return clone
}

/** Tint every mesh of an object (used on the body, not the eyes). */
export const tintAvatar = (object: THREE.Object3D, color: string) => {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of mats) {
      const std = mat as THREE.MeshStandardMaterial
      if (std.color) std.color.set(color)
    }
  })
}

/**
 * Builds a per-instance avatar (body + basic eyes), each a clone with its own
 * materials so every player can be tinted independently. Tinting is left to the
 * caller via `tintAvatar` so remotes can recolor without a re-render.
 */
export const useAvatar = () => {
  const { scene } = useGLTF(BODY_MODEL_PATH)
  const eyesGltf = useGLTF(EYES_MODEL_PATH)

  const body = useMemo(() => cloneWithOwnMaterials(scene), [scene])
  const eyes = useMemo(
    () => cloneWithOwnMaterials(eyesGltf.scene),
    [eyesGltf.scene],
  )

  return { body, eyes }
}

useGLTF.preload(BODY_MODEL_PATH)
useGLTF.preload(EYES_MODEL_PATH)
