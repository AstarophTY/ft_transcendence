import { Canvas } from '@react-three/fiber'
import {OrbitControls} from "@react-three/drei";

const SceneFrame = () => {
  return (
    <div className="absolute inset-0 z-0 h-full w-full">
      <Canvas className="h-full w-full">

          { /* TODO: Fill Real Content */ }
          <color attach="background" args={['black']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          <OrbitControls />
          <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="blue" />
          </mesh>

      </Canvas>
    </div>
  )
}

export default SceneFrame
