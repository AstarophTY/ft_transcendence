import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

import { applyCurvature } from '@/ui/three/utils/curvature'

export const useCurvedSceneMaterials = (scene: THREE.Object3D) => {
  const onBeforeCompile = useMemo(
    () =>
      function (this: THREE.Material, shader: THREE.WebGLProgramParametersWithUniforms) {
        applyCurvature(shader, this)
      },
    [],
  )

  useEffect(() => {
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return

      const mesh = child as THREE.Mesh
      mesh.castShadow = true
      mesh.receiveShadow = true
      
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => {
          m.onBeforeCompile = onBeforeCompile
        })
      } else {
        mesh.material.onBeforeCompile = onBeforeCompile
      }
    })
  }, [scene, onBeforeCompile])
}
