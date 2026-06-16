import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { ArrowLeft, Send, GripHorizontal } from 'lucide-react'
import type { DragControls } from 'motion/react'
import { Button } from '@/ui/shadcn/button.tsx'
import { Input } from '@/ui/shadcn/input.tsx'
import { useFriends } from '@/store/friends'
import { useAuth } from '@/store/auth.ts'
import Avatar from '@/ui/hud/friends/Avatar.tsx'
import MessageList from '@/ui/hud/friends/MessageList.tsx'
import { useIsMobile } from '@/hooks/use-mobile.tsx'
import { cn } from '@/lib/utils.ts'

interface ChatViewProps {
  dragControls?: DragControls
}

export default function ChatView({ dragControls }: ChatViewProps) {
  const { t } = useTranslation()
  const me = useAuth((s) => s.user)
  const { activeFriend, messages, messagesLoading, online, closeChat, send } =
    useFriends()
  const [draft, setDraft] = useState('')
  const isMobile = useIsMobile()

  if (!activeFriend) return null

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    const value = draft
    setDraft('')
    if (!(await send(value))) setDraft(value)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="flex h-full flex-col"
    >
      <header
        className={cn(
          "flex items-center gap-2 border-b p-3 select-none",
          !isMobile && "cursor-grab active:cursor-grabbing"
        )}
        onPointerDown={(e) => !isMobile && dragControls?.start(e)}
      >
        {!isMobile && <GripHorizontal className="h-5 w-5 text-muted-foreground mr-1" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            closeChat()
          }}
          title={t('friends.chat.back')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Avatar
          src={activeFriend.avatar}
          name={activeFriend.username}
          size={32}
          online={online.includes(activeFriend.id)}
        />
        <span className="font-medium select-none">{activeFriend.username}</span>
      </header>

      <MessageList
        messages={messages}
        loading={messagesLoading}
        myId={me?.userId}
      />

      <form onSubmit={onSubmit} className="flex gap-2 border-t p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('friends.chat.placeholder')}
          autoComplete="off"
          maxLength={2000}
        />
        <Button type="submit" size="icon" disabled={!draft.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </motion.div>
  )
}
