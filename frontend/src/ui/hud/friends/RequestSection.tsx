import type { ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
import { Button } from '@/ui/shadcn/button.tsx'

export function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="flex flex-col gap-1 px-1">
        <AnimatePresence initial={false}>{children}</AnimatePresence>
      </ul>
    </div>
  )
}

export function RequestAction({
  onClick,
  title,
  tone,
  children,
}: {
  onClick: () => void
  title: string
  tone: 'primary' | 'destructive'
  children: ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      title={title}
      className={tone === 'primary' ? 'text-primary' : 'text-destructive'}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
