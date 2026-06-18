import { Canvas } from '@react-three/fiber'
import { useSceneStore } from '@/engine/scene-store'
import { getScene } from '@/engine/scene-registry'

export function SceneLayer() {
  const activeSceneId = useSceneStore((s) => s.activeSceneId)
  const scene = getScene(activeSceneId)

  if (!scene) return null

  const { canvas: SceneCanvas, hud: SceneHUD, gui: SceneGUI } = scene

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Canvas className="absolute inset-0">
        <SceneCanvas />
      </Canvas>

      <div className="absolute inset-0 pointer-events-none">
        {SceneHUD && <SceneHUD />}
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {SceneGUI && <SceneGUI />}
      </div>
    </div>
  )
}
