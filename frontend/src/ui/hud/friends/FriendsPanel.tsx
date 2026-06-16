import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Users, UserPlus, Mailbox, MessageSquare, X, GripHorizontal } from 'lucide-react'
import type { DragControls } from 'motion/react'
import { useFriends } from '@/store/friends'
import { cn } from '@/lib/utils.ts'
import { Tab } from '@/types/Social.ts'
import ChatTab from '@/ui/hud/chat/ChatTab.tsx'
import FriendsList from './FriendsList.tsx'
import FriendRequests from './FriendRequests.tsx'
import AddFriend from './AddFriend.tsx'
import { useIsMobile } from '@/hooks/use-mobile.tsx'

interface FriendsPanelProps {
  dragControls?: DragControls
}

export default function FriendsPanel({ dragControls }: FriendsPanelProps) {
  const { t } = useTranslation()
  const { incoming, setPanelOpen } = useFriends()
  const [activeTab, setActiveTab] = useState<Tab>('friends')
  const isMobile = useIsMobile()

  const tabs = [
    { id: 'friends' as Tab, icon: Users,         label: t('friends.tabs.friends') },
    { id: 'requests' as Tab, icon: Mailbox,       label: t('friends.tabs.requests'), badge: incoming.length },
    { id: 'add' as Tab,      icon: UserPlus,      label: t('friends.tabs.add') },
    { id: 'chat' as Tab,     icon: MessageSquare, label: 'Chat' },
  ]

  return (
    <motion.div
      key="tabs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col"
    >
      <header
        className={cn(
          "flex items-center justify-between border-b p-4 select-none",
          !isMobile && "cursor-grab active:cursor-grabbing"
        )}
        onPointerDown={(e) => !isMobile && dragControls?.start(e)}
      >
        <div className="flex items-center gap-2">
          {!isMobile && <GripHorizontal className="h-5 w-5 text-muted-foreground" />}
          <h2 className="font-semibold select-none">{t('friends.title')}</h2>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setPanelOpen(false)
          }}
          className="text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <X className="size-5" />
        </button>
      </header>

      <nav className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 py-3 text-sm transition-colors',
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="size-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge ? (
              <span className="absolute right-3 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {tab.badge}
              </span>
            ) : null}
            {activeTab === tab.id && (
              <motion.span
                layoutId="social-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            /* Chat tab manages its own height — no wrapper scroll needed */
            <div key="chat" className="h-full">
              <ChatTab />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'friends'  && <FriendsList />}
              {activeTab === 'requests' && <FriendRequests />}
              {activeTab === 'add'      && <AddFriend />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
