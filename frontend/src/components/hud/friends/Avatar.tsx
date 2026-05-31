import { cn } from '@/lib/utils'

const STATUS_DOT: Record<string, string> = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-yellow-400',
  DND: 'bg-red-500',
  OFFLINE: 'bg-muted-foreground',
}

interface AvatarProps {
  src?: string | null
  name: string
  size?: number
  className?: string
  /** Simple boolean online dot (green / grey). */
  online?: boolean
  /** Full status enum — takes precedence over `online` when provided. */
  status?: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE'
}

/** Round avatar that falls back to the first letter of the username. */
export default function Avatar({
  src,
  name,
  size = 40,
  className,
  online,
  status,
}: AvatarProps) {
  const dimensions = { width: size, height: size }

  const inner = src ? (
    <img
      src={src}
      alt={name}
      style={dimensions}
      className={cn('rounded-full border object-cover', className)}
    />
  ) : (
    <div
      style={dimensions}
      className={cn(
        'flex select-none items-center justify-center rounded-full bg-secondary font-semibold uppercase text-secondary-foreground',
        className,
      )}
    >
      {name.charAt(0)}
    </div>
  )

  if (status === undefined && online === undefined) return inner

  const dotClass = status
    ? STATUS_DOT[status]
    : online
      ? 'bg-green-500'
      : 'bg-muted-foreground'

  return (
    <span className="relative inline-flex shrink-0">
      {inner}
      <span
        className={cn(
          'absolute bottom-0 right-0 size-3 rounded-full border-2 border-background',
          dotClass,
        )}
      />
    </span>
  )
}
