import { Toaster } from '@/components/shadcn/sonner'
import HUDFrame from './ui/hud/HUDFrame'
import SceneFrame from './ui/three/SceneFrame'

function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <SceneFrame />
      <HUDFrame />
      <Toaster />
    </div>
  )
}

export default App
