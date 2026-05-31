import { useTranslation } from 'react-i18next'
import { Pencil, Shield, ShieldOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { useAdmin } from '@/store/admin'
import Avatar from '@/components/hud/friends/Avatar'
import type { AdminUser } from '@/lib/admin'
import type { UserStatus } from '@/lib/account'

const STATUS_COLOR: Record<UserStatus, string> = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-yellow-400',
  DND: 'bg-red-500',
  OFFLINE: 'bg-muted-foreground',
}

export default function UserRow({ user }: { user: AdminUser }) {
  const { t, i18n } = useTranslation()
  const { changeRole, removeUser, setEditing } = useAdmin()
  const isAdmin = user.role === 'ADMIN'
  const is42 = Boolean(user.fortyTwoLogin)

  const joined = new Date(user.createdAt).toLocaleDateString(i18n.language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <tr className="border-b last:border-0 hover:bg-accent/30 transition-colors">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <Avatar src={user.avatar} name={user.username} size={32} />
            <span className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background ${STATUS_COLOR[user.status]}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-medium leading-tight">
              {user.username}
              {is42 && (
                <span className="rounded bg-secondary px-1 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                  42
                </span>
              )}
            </div>
            {user.displayName && (
              <div className="truncate text-xs text-muted-foreground">
                {user.displayName}
              </div>
            )}
            <div className="truncate text-xs text-muted-foreground">
              {user.email ?? user.fortyTwoLogin ?? '—'}
              {user.campus ? ` · ${user.campus}` : ''}
            </div>
          </div>
        </div>
      </td>

      <td className="px-3 py-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isAdmin
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {isAdmin ? t('role.ADMIN') : t('role.USER')}
        </span>
      </td>

      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
        {joined}
      </td>

      <td className="px-3 py-2 text-right">
        <Button
          variant="ghost"
          size="icon"
          title={t('admin.edit.title')}
          onClick={() => setEditing(user)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title={isAdmin ? t('admin.demote') : t('admin.promote')}
          onClick={() => changeRole(user.id, isAdmin ? 'USER' : 'ADMIN')}
        >
          {isAdmin ? (
            <ShieldOff className="size-4" />
          ) : (
            <Shield className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          title={t('admin.delete')}
          onClick={() => void removeUser(user)}
        >
          <Trash2 className="size-4" />
        </Button>
      </td>
    </tr>
  )
}
