import { useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'motion/react'
import ChatView from '@/components/hud/friends/ChatView'
import FriendsPanel from '@/components/hud/friends/FriendsPanel'
import { useFriends } from '@/store/friends'
import { useAuth } from '@/store/auth'

export default function SocialPanel() {
  const user = useAuth((s) => s.user)
  const { activeFriend, panelOpen, refresh } = useFriends()
  const dragControls = useDragControls()

  useEffect(() => {
    if (panelOpen) void refresh()
  }, [panelOpen, refresh])

  if (!user) return null

  return (
    <AnimatePresence>
      {panelOpen && (
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="pointer-events-auto absolute left-4 top-20 z-50 flex h-[70vh] w-96 flex-col overflow-hidden rounded-xl border bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md"
        >
          <AnimatePresence mode="wait">
            {activeFriend ? <ChatView dragControls={dragControls} key="chat" /> : <FriendsPanel dragControls={dragControls} key="panel" />}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
