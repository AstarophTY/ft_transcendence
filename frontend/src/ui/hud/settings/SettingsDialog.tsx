import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs.tsx'
import { useSettings } from '@/store/settings.ts'
import ProfileTab from './ProfileTab.tsx'
import AccountTab from './AccountTab.tsx'
import SecurityTab from './SecurityTab.tsx'
import PreferencesTab from './PreferencesTab.tsx'
import { useIsMobile } from '@/hooks/use-mobile.tsx'
import { cn } from '@/lib/utils.ts'

const ALL_TABS = [
  { id: 'profile', Comp: ProfileTab },
  { id: 'account', Comp: AccountTab },
  { id: 'security', Comp: SecurityTab },
  { id: 'preferences', Comp: PreferencesTab },
] as const

export default function SettingsDialog() {
  const { t } = useTranslation()
  const { open, setOpen, me, loading } = useSettings()
  const isMobile = useIsMobile()

  // 42 accounts have no local password — hide the Security tab.
  const is42 = Boolean(me?.fortyTwoLogin)
  const tabs = ALL_TABS.filter((tab) => tab.id !== 'security' || !is42)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={cn(
        "max-w-lg",
        isMobile && "fixed inset-0 w-screen h-screen max-w-none translate-x-0 translate-y-0 top-0 left-0 rounded-none border-none flex flex-col overflow-y-auto pt-14 p-6 animate-none"
      )}>
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
          <DialogDescription>{t('settings.description')}</DialogDescription>
        </DialogHeader>

        {loading || !me ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="profile" className="w-full flex flex-col flex-1">
            <TabsList
              className={cn(
                "grid w-full",
                isMobile && "flex flex-row overflow-x-auto scrollbar-none justify-start p-1 shrink-0"
              )}
              style={isMobile ? undefined : { gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
            >
              {tabs.map(({ id }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className={cn(isMobile && "shrink-0 px-4")}
                >
                  {t(`settings.tabs.${id}`)}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map(({ id, Comp }) => (
              <TabsContent key={id} value={id} className="mt-4 flex-1">
                <Comp />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
