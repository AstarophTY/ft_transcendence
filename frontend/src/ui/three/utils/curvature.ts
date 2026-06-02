import * as THREE from 'three'

export const CURVATURE_INTENSITY = 0.0001

export const getCurvatureOffset = (worldPos: THREE.Vector3, cameraPos: THREE.Vector3, curvature: number = CURVATURE_INTENSITY) => {
  const dx = worldPos.x - cameraPos.x
  const dz = worldPos.z - cameraPos.z
  const distSq = dx * dx + dz * dz
  return distSq * curvature
}

export const applyCurvature = (
  shader: THREE.WebGLProgramParametersWithUniforms,
  material: THREE.Material,
  curvature: number = CURVATURE_INTENSITY
) => {
  shader.uniforms.uCameraPosition = { value: new THREE.Vector3() }
  shader.uniforms.uCurvature = { value: curvature }
  material.userData.shader = shader
  
  shader.vertexShader = `
    uniform vec3 uCameraPosition;
    uniform float uCurvature;
  ` + shader.vertexShader

  // If it's an InstancedMesh, we use instanceMatrix.
  // If it's a regular Mesh, instanceMatrix might not be present in the shader or should be identity.
  // Actually, Three.js provides #ifdef USE_INSTANCING.
  
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
    #include <begin_vertex>
    
    vec4 worldPos;
    #ifdef USE_INSTANCING
      worldPos = instanceMatrix * vec4(position, 1.0);
    #else
      worldPos = vec4(position, 1.0);
    #endif
    worldPos = modelMatrix * worldPos;
    
    float dist = distance(worldPos.xz, uCameraPosition.xz);
    transformed.y -= pow(dist, 2.0) * uCurvature;
    `
  )
}

export const updateCurvatureUniforms = (material: THREE.Material | THREE.Material[], camera: THREE.Camera, curvature: number = CURVATURE_INTENSITY) => {
  const materials = Array.isArray(material) ? material : [material]
  materials.forEach(m => {
    if (m.userData.shader) {
      m.userData.shader.uniforms.uCameraPosition.value.copy(camera.position)
      m.userData.shader.uniforms.uCurvature.value = curvature
    }
  })
}
