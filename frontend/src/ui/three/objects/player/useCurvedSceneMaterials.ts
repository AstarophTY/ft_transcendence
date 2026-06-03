import { useEffect } from 'react'
import * as THREE from 'three'

export const useCurvedSceneMaterials = (scene: THREE.Object3D) => {
  useEffect(() => {
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return

      const mesh = child as THREE.Mesh
      mesh.castShadow = true
      mesh.receiveShadow = true
    })
  }, [scene])
}
