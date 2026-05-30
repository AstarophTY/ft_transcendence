import { useTranslation } from 'react-i18next'
import type { AdminStats } from '@/lib/admin'

export default function StatsGrid({ stats }: { stats: AdminStats }) {
  const { t } = useTranslation()
  const cards: { key: keyof AdminStats; label: string }[] = [
    { key: 'total', label: t('admin.stats.total') },
    { key: 'newLast7Days', label: t('admin.stats.new7d') },
    { key: 'admins', label: t('admin.stats.admins') },
    { key: 'users', label: t('admin.stats.users') },
    { key: 'fortyTwo', label: t('admin.stats.fortyTwo') },
    { key: 'local', label: t('admin.stats.local') },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map(({ key, label }) => (
        <div key={key} className="rounded-lg border bg-card/50 p-3 text-center">
          <div className="text-2xl font-bold text-primary">{stats[key]}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  )
}
