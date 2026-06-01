import { Toaster } from '@/components/shadcn/sonner'
import HUDFrame from './ui/hud/HUDFrame'
import SceneFrame from './ui/three/SceneFrame'
import { SidebarProvider } from '@/components/shadcn/sidebar'
import { TooltipProvider } from '@/components/shadcn/tooltip'

function App() {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}>
        <div className="relative h-screen w-screen overflow-hidden">
          <SceneFrame />
          <HUDFrame />
          <Toaster />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export default App
