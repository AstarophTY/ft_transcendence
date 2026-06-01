import { Environment, Sky } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

import WorldScene from './scenes/WorldScene.tsx'

const SceneFrame = () => {
  return (
    <div className="absolute inset-0 z-0 h-full w-full">
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
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        <WorldScene />
      </Canvas>
    </div>
  )
}

export default SceneFrame
