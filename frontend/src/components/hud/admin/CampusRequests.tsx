import { useTranslation } from 'react-i18next'
import { Building2, Check, X } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { ScrollArea } from '@/components/shadcn/scroll-area'
import { useAdmin } from '@/store/admin'

export default function CampusRequests() {
  const { t, i18n } = useTranslation()
  const { campusRequests, users, approveCampus, declineCampus } = useAdmin()

  const requesterName = (id: string) =>
    users.find((u) => u.id === id)?.username ?? '—'

  if (campusRequests.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border text-sm text-muted-foreground">
        <Building2 className="size-6 opacity-50" />
        {t('admin.campus.empty')}
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <ScrollArea className="max-h-[50vh]">
        <ul className="divide-y">
          {campusRequests.map((req) => (
            <li key={req.id} className="flex items-center gap-3 px-3 py-2.5">
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{req.label}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {t('admin.campus.requestedBy', {
                    user: requesterName(req.requestedById),
                  })}
                  {' · '}
                  {new Date(req.createdAt).toLocaleDateString(i18n.language)}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={() => void approveCampus(req)}
                >
                  <Check className="size-4" />
                  {t('admin.campus.approve')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void declineCampus(req)}
                >
                  <X className="size-4" />
                  {t('admin.campus.decline')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
