import { useTranslation } from 'react-i18next'
import type { AuthUser } from '@/store/auth'
import { cn } from '@/lib/utils'

interface UserBadgeProps {
  user: AuthUser
  className?: string
}

/**
 * Avatar + username + role (group) for the current user.
 * Shared between the auth menu and the social panel trigger.
 */
export default function UserBadge({ user, className }: UserBadgeProps) {
  const { t } = useTranslation()
  const name = user.username || user.email || user.userId.slice(0, 8)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={name}
          className="size-8 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="flex flex-col leading-tight text-left">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">
          {t(`role.${user.role}`)}
        </span>
      </div>
    </div>
  )
}
