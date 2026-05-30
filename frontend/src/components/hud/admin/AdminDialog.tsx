import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog'
import { useAdmin } from '@/store/admin'
import StatsGrid from './StatsGrid'
import UserRow from './UserRow'

export default function AdminDialog() {
  const { t } = useTranslation()
  const { open, setOpen, stats, users, loading } = useAdmin()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('admin.title')}</DialogTitle>
        </DialogHeader>

        {loading && !stats ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {stats && <StatsGrid stats={stats} />}
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 text-left">{t('admin.user')}</th>
                    <th>{t('admin.role')}</th>
                    <th className="text-right">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <UserRow key={u.id} user={u} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
