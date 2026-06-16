import { useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import ChatView from '@/ui/hud/friends/ChatView.tsx'
import FriendsPanel from '@/ui/hud/friends/FriendsPanel.tsx'
import { useFriends } from '@/store/friends'
import { useAuth } from '@/store/auth.ts'
import { useIsMobile } from '@/hooks/use-mobile.tsx'

export default function SocialPanel() {
  const user = useAuth((s) => s.user)
  const { activeFriend, panelOpen, refresh } = useFriends()
  const dragControls = useDragControls()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (panelOpen) void refresh()
  }, [panelOpen, refresh])

  if (!user) return null

  return (
    <AnimatePresence>
      {panelOpen && (
        <div className="
          /* Desktop (Default) */
          absolute left-4 top-20 w-[400px] h-[70vh] z-[60]

          /* Mobile Portrait */
          max-md:fixed max-md:bottom-0 max-md:inset-x-0 max-md:top-auto max-md:left-auto max-md:w-full max-md:h-[60vh]

          /* Mobile/Tablet Landscape */
          max-lg:landscape:fixed max-lg:landscape:top-0 max-lg:landscape:bottom-0 max-lg:landscape:right-0 max-lg:landscape:left-auto max-lg:landscape:w-[320px] max-lg:landscape:h-full
        ">
          <motion.div
            key={isMobile ? 'mobile' : 'desktop'}
            drag={!isMobile}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="
              flex flex-col h-full w-full pointer-events-auto
              bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
              shadow-lg

              /* Desktop */
              rounded-xl border border-border/40 p-4 space-y-4

              /* Mobile Portrait */
              max-md:rounded-t-2xl max-md:rounded-b-none max-md:border-t max-md:border-x-0 max-md:border-b-0 max-md:p-4 max-md:space-y-4

              /* Mobile Landscape */
              max-lg:landscape:rounded-l-2xl max-lg:landscape:rounded-r-none max-lg:landscape:border-l max-lg:landscape:border-y-0 max-lg:landscape:border-r-0 max-lg:landscape:p-3 max-lg:landscape:space-y-3
            "
          >
            {/* Visual Handle for bottom sheet - Only visible on Mobile Portrait */}
            <div className="hidden max-md:portrait:block w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto -mt-1 mb-2" />

            <AnimatePresence mode="wait">
              {activeFriend ? <ChatView dragControls={dragControls} key="chat" /> : <FriendsPanel dragControls={dragControls} key="panel" />}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
