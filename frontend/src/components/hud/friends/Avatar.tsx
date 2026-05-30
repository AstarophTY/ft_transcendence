import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name: string
  size?: number
  className?: string
  /** When set, shows a green (online) / grey (offline) status dot. */
  online?: boolean
}

/** Round avatar that falls back to the first letter of the username. */
export default function Avatar({
  src,
  name,
  size = 40,
  className,
  online,
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

  if (online === undefined) return inner

  return (
    <span className="relative inline-flex shrink-0">
      {inner}
      <span
        className={cn(
          'absolute bottom-0 right-0 size-3 rounded-full border-2 border-background',
          online ? 'bg-green-500' : 'bg-muted-foreground',
        )}
        title={online ? 'online' : 'offline'}
      />
    </span>
  )
}
