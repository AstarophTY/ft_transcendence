import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DirectMessage } from '@/lib/api'

interface MessageListProps {
  messages: DirectMessage[]
  loading: boolean
  myId?: string
}

export default function MessageList({
  messages,
  loading,
  myId,
}: MessageListProps) {
  const { t } = useTranslation()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 space-y-2 overflow-y-auto p-3">
      {loading ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <p className="pt-8 text-center text-sm text-muted-foreground">
          {t('friends.chat.empty')}
        </p>
      ) : (
        messages.map((m) => {
          const mine = m.senderId === myId
          return (
            <div
              key={m.id}
              className={cn('flex', mine ? 'justify-end' : 'justify-start')}
            >
              <span
                className={cn(
                  'max-w-[75%] break-words rounded-2xl px-3 py-2 text-sm',
                  mine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground',
                )}
              >
                {m.content}
              </span>
            </div>
          )
        })
      )}
      <div ref={bottomRef} />
    </div>
  )
}
