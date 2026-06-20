import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useSceneStore } from '@/engine/scene-store'
import { getScene } from '@/engine/scene-registry'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'


export function SceneLayer() {
  const activeSceneId = useSceneStore((scene) => scene.activeSceneId)
  const guiOpen = useSceneStore((scene) => scene.guiOpen)
  const setGuiOpen = useSceneStore((scene) => scene.setGuiOpen)
  const toggleGui = useSceneStore((scene) => scene.toggleGui)
  const scene = getScene(activeSceneId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleGui()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleGui])

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

      {guiOpen && SceneGUI && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setGuiOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-xl bg-popover text-popover-foreground ring-1 ring-foreground/10 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3"
              onClick={() => setGuiOpen(false)}
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>

            <SceneGUI />

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Press ESC to close
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
