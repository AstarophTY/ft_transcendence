import { Environment, Sky } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

import WorldScene from './scenes/WorldScene.tsx'
import PlanetSelectionScene from './scenes/PlanetSelectionScene'
import { usePlanetStore } from '@/store/planetStore'

const SceneFrame = () => {
  const sceneMode = usePlanetStore(state => state.sceneMode)

  return (
    <>
      <div id="canvas-container" className="absolute inset-0 z-0 h-full w-full">
        <Canvas className="h-full w-full" camera={{ position: [0, 1.5, 4], fov: 45 }} shadows>
          <Sky sunPosition={[100, 20, 100]} />
          <Environment background={false} preset={undefined}>
            <Sky sunPosition={[100, 20, 100]} />
          </Environment>
          <ambientLight intensity={0.3} />
          <hemisphereLight
            args={['#ffffff', '#444444', 0.5]}
            position={[0, 50, 0]}
          />
          {sceneMode === 'world' ? (
            <WorldScene />
          ) : (
            <>
              <directionalLight
                position={[150, 250, 150]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-120}
                shadow-camera-right={120}
                shadow-camera-top={120}
                shadow-camera-bottom={-120}
                shadow-camera-near={0.1}
                shadow-camera-far={500}
              />
              <PlanetSelectionScene />
            </>
          )}
        </Canvas>
      </div>
    </>
  )
}

export default SceneFrame
