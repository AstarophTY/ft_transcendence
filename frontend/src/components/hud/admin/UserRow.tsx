import { useTranslation } from 'react-i18next'
import { Pencil, Shield, ShieldOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { useAdmin } from '@/store/admin'
import type { AdminUser } from '@/lib/admin'

export default function UserRow({ user }: { user: AdminUser }) {
  const { t } = useTranslation()
  const { changeRole, removeUser, setEditing } = useAdmin()
  const isAdmin = user.role === 'ADMIN'

  return (
    <tr className="border-b last:border-0">
      <td className="py-2">
        <div className="font-medium">{user.username}</div>
        <div className="text-xs text-muted-foreground">
          {user.email ?? user.fortyTwoLogin ?? '—'}
          {user.campus ? ` · ${user.campus}` : ''}
        </div>
      </td>
      <td className="text-center text-xs">{isAdmin ? 'ADMIN' : 'USER'}</td>
      <td className="text-right">
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
          {isAdmin ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
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
