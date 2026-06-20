import { Button } from '@/components/ui/button'
import { useSceneStore } from '@/engine/scene-store'

export function DefaultGUI() {
  const setGuiOpen = useSceneStore((scene) => scene.setGuiOpen)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Menu</h2>
      <Button variant="outline" className="w-full justify-start" onClick={() => setGuiOpen(false)}>Resume</Button>
    </div>
  )
}
