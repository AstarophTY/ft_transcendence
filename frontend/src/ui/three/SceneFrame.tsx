import { Canvas } from '@react-three/fiber'

import WorldScene from './scenes/WorldScene.tsx'

const SceneFrame = () => {
  return (
    <div className="absolute inset-0 z-0 h-full w-full">
      <Canvas className="h-full w-full" camera={{ position: [0, 1.5, 4], fov: 45 }}>
        <color attach="background" args={['#050816']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.4} />
        <WorldScene />
      </Canvas>
    </div>
  )
}

export default SceneFrame
