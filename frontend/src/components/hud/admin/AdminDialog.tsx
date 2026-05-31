import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs'
import { Input } from '@/components/shadcn/input'
import { useAdmin } from '@/store/admin'
import type { AdminUser } from '@/lib/admin'
import StatsGrid from './StatsGrid'
import SignupsChart from './SignupsChart'
import UserRow from './UserRow'
import AdminEditUser from './AdminEditUser'

type RoleFilter = 'all' | 'admin' | 'user'
type TypeFilter = 'all' | '42' | 'local'

function UsersTab({ users }: { users: AdminUser[] }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      u.username.toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.fortyTwoLogin ?? '').toLowerCase().includes(q) ||
      (u.displayName ?? '').toLowerCase().includes(q)
    const matchRole =
      roleFilter === 'all' ||
      (roleFilter === 'admin' && u.role === 'ADMIN') ||
      (roleFilter === 'user' && u.role === 'USER')
    const matchType =
      typeFilter === 'all' ||
      (typeFilter === '42' && Boolean(u.fortyTwoLogin)) ||
      (typeFilter === 'local' && !u.fortyTwoLogin)
    return matchSearch && matchRole && matchType
  })

  const roleFilters: { key: RoleFilter; label: string }[] = [
    { key: 'all', label: t('admin.filter.all') },
    { key: 'admin', label: t('admin.filter.admin') },
    { key: 'user', label: t('admin.filter.user') },
  ]

  const typeFilters: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: t('admin.filter.all') },
    { key: '42', label: t('admin.filter.42') },
    { key: 'local', label: t('admin.filter.local') },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('admin.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          {roleFilters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRoleFilter(key)}
              className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                roleFilter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          {typeFilters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                typeFilter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-muted-foreground">
          {filtered.length} / {users.length}
        </span>
      </div>

      <div className="max-h-[50vh] overflow-y-auto rounded-lg border">
        {filtered.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t('admin.noUsers')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="px-3 py-2 text-left">{t('admin.user')}</th>
                <th className="px-3 py-2 text-left">{t('admin.role')}</th>
                <th className="px-3 py-2 text-left">{t('admin.joined')}</th>
                <th className="px-3 py-2 text-right">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function AdminDialog() {
  const { t } = useTranslation()
  const { open, setOpen, stats, signups, users, loading } = useAdmin()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('admin.title')}</DialogTitle>
        </DialogHeader>

        {loading && !stats ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="users">
                {t('admin.tabs.users')}
                <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {users.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              {stats && <StatsGrid stats={stats} />}
              {signups.length > 0 && <SignupsChart data={signups} />}
            </TabsContent>

            <TabsContent value="users" className="mt-4">
              <UsersTab users={users} />
            </TabsContent>
          </Tabs>
        )}

        <AdminEditUser />
      </DialogContent>
    </Dialog>
  )
}
