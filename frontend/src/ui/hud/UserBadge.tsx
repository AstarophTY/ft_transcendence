import { useTranslation } from 'react-i18next'
import { UserBadgeProps } from "@/types/user.ts"
import { cn } from '@/lib/utils.ts'


/**
 * Avatar + username + role (group) for the current user.
 * Shared between the auth menu and the social panel trigger.
 */
export default function UserBadge({ user, className, onlyAvatar }: UserBadgeProps) {
  const { t } = useTranslation()
  const name = user.username || user.email || user.userId.slice(0, 8)

  return (
    <div className={cn('flex items-center', !onlyAvatar && 'gap-3', className)}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={name}
          className={cn("rounded-full object-cover", onlyAvatar ? "size-12" : "size-8")}
        />
      ) : (
        <span className={cn(
          "flex items-center justify-center rounded-full bg-primary text-primary-foreground",
          onlyAvatar ? "size-12 text-lg font-bold" : "size-8 text-sm font-semibold"
        )}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      {!onlyAvatar && (
        <div className="flex flex-col leading-tight text-left">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">
            {t(`role.${user.role}`)}
          </span>
        </div>
      )}
    </div>
  )
}
