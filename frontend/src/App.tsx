import { useEffect } from 'react'
import { Toaster } from '@/ui/shadcn/sonner'
import { useAuth } from '@/store/auth'
import { useFriends } from '@/store/friends'
import { useSettings } from '@/store/settings'
import { usePlanetStore } from '@/store/planetStore'
import { disconnectWorldSocket } from '@/lib/sockets/worldSocket'
import i18n from '@/i18n'
import HUDFrame from './ui/hud/HUDFrame'
import SceneFrame from './ui/three/SceneFrame'
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
      // Logging out (or any session loss): drop the real-time channels and leave
      // any island the player is standing on, returning to the main menu. Closing
      // the world socket fires the server-side disconnect that removes the player
      // from the island, and switching to 'selection' unmounts the world scene
      // (which emits `world:leave`) so we land back on planet selection.
      disconnect()
      disconnectWorldSocket()
      usePlanetStore.getState().setSceneMode('selection')
    }
  }, [user, connect, disconnect, loadSettings])

  return (
    <TooltipProvider>
      <div className="relative h-screen w-screen overflow-hidden">
        <SceneFrame />
        <HUDFrame />
        <Toaster />
      </div>
    </TooltipProvider>
  )
}

export default App
