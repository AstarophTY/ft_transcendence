import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Send } from 'lucide-react'
import { Button } from '@/ui/shadcn/button.tsx'
import { Input } from '@/ui/shadcn/input.tsx'
import { cn } from '@/lib/utils.ts'
import { useAuth } from '@/store/auth.ts'
import type { ChatMessage } from '@/store/chatChannels.ts'

interface ChannelChatProps {
  messages: ChatMessage[]
  onSend: (content: string) => void
  placeholder?: string
  emptyText?: string
  /** When true the input is replaced by a hint message. */
  disabled?: boolean
  disabledText?: string
}

export default function ChannelChat({
  messages,
  onSend,
  placeholder,
  emptyText,
  disabled,
  disabledText,
}: ChannelChatProps) {
  const { t } = useTranslation()
  const myId = useAuth((s) => s.user?.userId)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || disabled) return
    onSend(draft.trim())
    setDraft('')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="pt-8 text-center text-sm text-muted-foreground">
            {emptyText ?? t('chat.empty')}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === myId
            return (
              <div
                key={m.id}
                className={cn('flex flex-col gap-0.5', mine ? 'items-end' : 'items-start')}
              >
                {!mine && (
                  <span className="px-1 text-[11px] font-semibold text-muted-foreground">
                    {m.senderName}
                  </span>
                )}
                <span
                  className={cn(
                    'max-w-[75%] break-words rounded-2xl px-3 py-1.5 text-sm',
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

      {/* Input or disabled hint */}
      {disabled ? (
        <p className="border-t p-3 text-center text-xs text-muted-foreground">
          {disabledText ?? t('chat.unavailable')}
        </p>
      ) : (
        <form onSubmit={submit} className="flex gap-2 border-t p-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder ?? t('chat.placeholder')}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!draft.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      )}
    </div>
  )
}
