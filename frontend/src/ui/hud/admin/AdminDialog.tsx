import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs.tsx'
import { Input } from '@/ui/shadcn/input.tsx'
import { ScrollArea } from '@/ui/shadcn/scroll-area.tsx'
import { Separator } from '@/ui/shadcn/separator.tsx'
import { Badge } from '@/ui/shadcn/badge.tsx'
import { ToggleGroup, ToggleGroupItem } from '@/ui/shadcn/toggle-group.tsx'
import { useAdmin } from '@/store/admin.ts'
import type { AdminUser } from '@/lib/api/admin.ts'
import StatsGrid from './StatsGrid.tsx'
import SignupsChart from './SignupsChart.tsx'
import UserRow from './UserRow.tsx'
import AdminEditUser from './AdminEditUser.tsx'
import CampusManager from './CampusManager.tsx'
import SeasonAdminPanel from './SeasonAdminPanel.tsx'

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

      <div className="flex items-center gap-3 text-xs">
        <ToggleGroup
          type="single"
          value={roleFilter}
          onValueChange={(v) => v && setRoleFilter(v as RoleFilter)}
        >
          <ToggleGroupItem value="all">{t('admin.filter.all')}</ToggleGroupItem>
          <ToggleGroupItem value="admin">{t('admin.filter.admin')}</ToggleGroupItem>
          <ToggleGroupItem value="user">{t('admin.filter.user')}</ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-5" />

        <ToggleGroup
          type="single"
          value={typeFilter}
          onValueChange={(v) => v && setTypeFilter(v as TypeFilter)}
        >
          <ToggleGroupItem value="all">{t('admin.filter.all')}</ToggleGroupItem>
          <ToggleGroupItem value="42">{t('admin.filter.42')}</ToggleGroupItem>
          <ToggleGroupItem value="local">{t('admin.filter.local')}</ToggleGroupItem>
        </ToggleGroup>

        <span className="ml-auto text-muted-foreground">
          {filtered.length} / {users.length}
        </span>
      </div>

      <div className="rounded-lg border">
        {filtered.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t('admin.noUsers')}
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh]">
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
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

export default function AdminDialog() {
  const { t } = useTranslation()
  const { open, setOpen, stats, signups, users, loading, editing } =
    useAdmin()

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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="users">
                {t('admin.tabs.users')}
                <Badge variant="secondary" className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]">
                  {users.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="campus">
                {t('admin.tabs.campus')}
              </TabsTrigger>
              <TabsTrigger value="season">
                {t('admin.tabs.season')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
              {stats && <StatsGrid stats={stats} />}
              {signups.length > 0 && <SignupsChart data={signups} />}
            </TabsContent>

            <TabsContent value="users" className="mt-4">
              <UsersTab users={users} />
            </TabsContent>

            <TabsContent value="campus" className="mt-4 flex flex-col gap-5">
              <section className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('admin.campus.manageSection')}
                </p>
                <CampusManager />
              </section>
            </TabsContent>

            <TabsContent value="season" className="mt-4">
              <SeasonAdminPanel />
            </TabsContent>
          </Tabs>
        )}

        {editing && <AdminEditUser key={editing.id} />}
      </DialogContent>
    </Dialog>
  )
}
