import { useEffect } from 'react'
import { Toaster } from '@/components/shadcn/sonner'
import { useAuth } from '@/store/auth'
import { useFriends } from '@/store/friends'
import HUDFrame from './ui/hud/HUDFrame'
import SceneFrame from './ui/three/SceneFrame'

function App() {
  const init = useAuth((s) => s.init)
  const user = useAuth((s) => s.user)
  const connect = useFriends((s) => s.connect)
  const disconnect = useFriends((s) => s.disconnect)

  // Consume 42 OAuth tokens from the callback URL and restore the session.
  useEffect(() => {
    init()
  }, [init])

  // Open/close the real-time channel as the user logs in and out.
  useEffect(() => {
    if (user) connect()
    else disconnect()
  }, [user, connect, disconnect])

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <SceneFrame />
      <HUDFrame />
      <Toaster />
    </div>
  )
}

export default App
