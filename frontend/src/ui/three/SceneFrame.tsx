/* eslint-disable react/no-unknown-property */

import { Canvas } from '@react-three/fiber'

import PlanetSelectionScene from './scenes/PlanetSelectionScene.tsx'

const SceneFrame = () => {
  return (
    <div className="absolute inset-0 z-0 h-full w-full">
      <Canvas className="h-full w-full" camera={{ position: [0, 4, 0], fov: 45 }}>
        <color attach="background" args={['#050816']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.4} />
        <PlanetSelectionScene />
      </Canvas>
    </div>
  )
}

export default SceneFrame
