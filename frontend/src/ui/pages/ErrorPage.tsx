import type { LucideIcon } from 'lucide-react'
import { Button } from '@/ui/shadcn/button.tsx'

export interface ErrorPageProps {
  /** Icon shown in the circular badge. */
  icon: LucideIcon
  title: string
  description: string
  /** Big faded status code behind the title (e.g. "404", "500"). */
  code?: string
  actionLabel: string
  onAction: () => void
  actionIcon?: LucideIcon
}

/**
 * Full-screen, shadcn-styled error card. Shared by the 404 page and the
 * top-level error boundary so every error state looks consistent (mirrors the
 * WebGL error boundary's look).
 */
export default function ErrorPage({
  icon: Icon,
  title,
  description,
  code,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
}: ErrorPageProps) {
  return (
    <div className="absolute inset-0 z-50 flex select-none flex-col items-center justify-center bg-background p-6 text-center duration-300 animate-in fade-in">
      <div className="flex w-full max-w-md flex-col items-center space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-2xl">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Icon className="size-7" />
        </div>

        <div className="space-y-1.5">
          {code && (
            <p className="text-5xl font-black tabular-nums tracking-tight text-muted-foreground/30">
              {code}
            </p>
          )}
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <Button
          onClick={onAction}
          className="h-11 w-full gap-2 font-medium shadow-lg transition-all hover:shadow-xl"
        >
          {ActionIcon && <ActionIcon className="size-4" />}
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
