import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs.tsx'
import { useSettings } from '@/store/settings.ts'
import ProfileTab from './ProfileTab.tsx'
import AccountTab from './AccountTab.tsx'
import SecurityTab from './SecurityTab.tsx'
import PreferencesTab from './PreferencesTab.tsx'

const ALL_TABS = [
  { id: 'profile', Comp: ProfileTab },
  { id: 'account', Comp: AccountTab },
  { id: 'security', Comp: SecurityTab },
  { id: 'preferences', Comp: PreferencesTab },
] as const

export default function SettingsDialog() {
  const { t } = useTranslation()
  const { open, setOpen, me, loading } = useSettings()

  // 42 accounts have no local password — hide the Security tab.
  const is42 = Boolean(me?.fortyTwoLogin)
  const tabs = ALL_TABS.filter((tab) => tab.id !== 'security' || !is42)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>

        {loading || !me ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList
              className="grid w-full"
              style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
            >
              {tabs.map(({ id }) => (
                <TabsTrigger key={id} value={id}>
                  {t(`settings.tabs.${id}`)}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map(({ id, Comp }) => (
              <TabsContent key={id} value={id} className="mt-4">
                <Comp />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
