import { useEffect, useRef, ElementType } from 'react'
import { Environment, Sky } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'

import WorldScene from './scenes/WorldScene.tsx'
import PlanetSelectionScene from './scenes/PlanetSelectionScene'
import { usePlanetStore } from '@/store/planetStore'
import { useIsTouchDevice } from '@/hooks/use-mobile.tsx'
import { WebGLErrorBoundary } from './ErrorBoundary.tsx'

const AmbientLight = 'ambientLight' as unknown as ElementType
const HemisphereLight = 'hemisphereLight' as unknown as ElementType
const DirectionalLight = 'directionalLight' as unknown as ElementType

const SceneFrame = () => {
  const sceneMode = usePlanetStore(state => state.sceneMode)
  const isTouch = useIsTouchDevice()
  const lightRef = useRef<THREE.DirectionalLight>(null)

  useEffect(() => {
    const light = lightRef.current
    if (light) {
      const cam = light.shadow.camera
      cam.left = -120
      cam.right = 120
      cam.top = 120
      cam.bottom = -120
      cam.near = 0.1
      cam.far = 500
      cam.updateProjectionMatrix()
    }
  }, [sceneMode])

  return (
    <>
      <div id="canvas-container" className={`absolute inset-0 z-0 h-full w-full ${isTouch ? 'pointer-events-none' : ''}`}>
        <WebGLErrorBoundary>
          <Canvas className="h-full w-full" camera={{ position: [0, 1.5, 4], fov: 45 }} shadows>
          <Sky sunPosition={[100, 20, 100]} />
          <Environment background={false} preset={undefined}>
            <Sky sunPosition={[100, 20, 100]} />
          </Environment>
          <AmbientLight intensity={0.3} />
          <HemisphereLight
            args={['#ffffff', '#444444', 0.5]}
            position={[0, 50, 0]}
          />
          {sceneMode === 'world' ? (
            <WorldScene />
          ) : (
            <>
              <DirectionalLight
                ref={lightRef}
                position={[150, 250, 150]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[2048, 2048]}
              />
              <PlanetSelectionScene />
            </>
          )}
        </Canvas>
        </WebGLErrorBoundary>
      </div>
    </>
  )
}

export default SceneFrame
