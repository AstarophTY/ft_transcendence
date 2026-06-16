import { useTranslation } from 'react-i18next'
import { Pencil, Shield, ShieldOff, Trash2 } from 'lucide-react'
import { Button } from '@/ui/shadcn/button.tsx'
import { Badge } from '@/ui/shadcn/badge.tsx'
import { useAdmin } from '@/store/admin.ts'
import { useAuth } from '@/store/auth.ts'
import Avatar from '@/ui/hud/friends/Avatar.tsx'
import {UserStatus} from "@/types/api/account.ts";
import {AdminUser} from "@/types/api/admin.ts";

const STATUS_COLOR: Record<UserStatus, string> = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-yellow-400',
  DND: 'bg-red-500',
  OFFLINE: 'bg-muted-foreground',
}

export default function UserRow({ user }: { user: AdminUser }) {
  const { t, i18n } = useTranslation()
  const { changeRole, removeUser, setEditing } = useAdmin()
  const me = useAuth((s) => s.user)
  const isMe = me?.userId === user.id
  const isAdmin = user.role === 'ADMIN'
  const is42 = Boolean(user.fortyTwoLogin)

  const joined = new Date(user.createdAt).toLocaleDateString(i18n.language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <tr className="border-b last:border-0 transition-colors hover:bg-accent/30">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <Avatar src={user.avatar} name={user.username} size={32} />
            <span
              className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background ${STATUS_COLOR[user.status]}`}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-medium leading-tight">
              {user.username}
              {is42 && (
                <Badge variant="secondary" className="rounded px-1 py-0 text-[10px]">
                  42
                </Badge>
              )}
            </div>
            {user.displayName && (
              <div className="truncate text-xs text-muted-foreground">
                {user.displayName}
              </div>
            )}
            <div className="truncate text-xs text-muted-foreground">
              {user.email ?? user.fortyTwoLogin ?? '—'}
              {user.campus ? ` · ${user.campus.label}` : ''}
            </div>
          </div>
        </div>
      </td>

      <td className="px-3 py-2">
        <Badge variant={isAdmin ? 'warning' : 'secondary'}>
          {isAdmin ? t('role.ADMIN') : t('role.USER')}
        </Badge>
      </td>

      <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
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
          disabled={isMe}
        >
          {isAdmin ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          title={t('admin.delete')}
          onClick={() => void removeUser(user)}
          disabled={isMe}
        >
          <Trash2 className="size-4" />
        </Button>
      </td>
    </tr>
  )
}
