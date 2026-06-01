import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { ArrowLeft, Send, GripHorizontal } from 'lucide-react'
import type { DragControls } from 'motion/react'
import { Button } from '@/components/shadcn/button'
import { Input } from '@/components/shadcn/input'
import { useFriends } from '@/store/friends'
import { useAuth } from '@/store/auth'
import Avatar from './Avatar'
import MessageList from './MessageList'

interface ChatViewProps {
  dragControls?: DragControls
}

export default function ChatView({ dragControls }: ChatViewProps) {
  const { t } = useTranslation()
  const me = useAuth((s) => s.user)
  const { activeFriend, messages, messagesLoading, online, closeChat, send } =
    useFriends()
  const [draft, setDraft] = useState('')

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
        className="flex items-center gap-2 border-b p-3 cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => dragControls?.start(e)}
      >
        <GripHorizontal className="h-5 w-5 text-muted-foreground mr-1" />
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
        />
        <Button type="submit" size="icon" disabled={!draft.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </motion.div>
  )
}
