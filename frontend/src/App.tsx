import { useEffect } from 'react'
import { Toaster } from '@/ui/shadcn/sonner'
import { useAuth } from '@/store/auth'
import { useFriends } from '@/store/friends'
import { useSettings } from '@/store/settings'
import { usePlanetStore } from '@/store/planetStore'
import i18n from '@/i18n'
import HUDFrame from './ui/hud/HUDFrame'
import SceneFrame from './ui/three/SceneFrame'
import { SidebarProvider } from '@/ui/shadcn/sidebar'
import { TooltipProvider } from '@/ui/shadcn/tooltip'

function App() {
  const init = useAuth((s) => s.init)
  const user = useAuth((s) => s.user)
  const connect = useFriends((s) => s.connect)
  const disconnect = useFriends((s) => s.disconnect)
  const loadSettings = useSettings((s) => s.load)

  // Load local theme preference immediately on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }, [])

  // Consume 42 OAuth tokens from the callback URL and restore the session.
  useEffect(() => {
    init()
  }, [init])

  // Open/close the real-time channel and apply saved preferences when logged in.
  useEffect(() => {
    if (user) {
      connect()
      void loadSettings().then(() => {
        const me = useSettings.getState().me
        if (me?.theme) {
          usePlanetStore.getState().setTheme(me.theme as 'light' | 'dark')
        }
        if (me?.language) {
          void i18n.changeLanguage(me.language)
        }
      })
    } else {
      disconnect()
    }
  }, [user, connect, disconnect, loadSettings])

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
