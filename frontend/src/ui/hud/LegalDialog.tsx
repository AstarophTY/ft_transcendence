import { useTranslation } from 'react-i18next'
<<<<<<< HEAD
import { ShieldCheck } from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
=======
import { ShieldCheck, FileText } from 'lucide-react'

>>>>>>> 4d157b7 (feat(privacy): Add link privacy to menu and connect page)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
<<<<<<< HEAD
import { cn } from '@/lib/utils'

type LegalSection = { title: string; body: string }

export default function LegalDialog({
  open,
  onOpenChange,
  requireAccept = false,
  onAccept,
  onDecline,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Force the user to choose Accept/Decline (used for new 42 accounts). */
  requireAccept?: boolean
  onAccept?: () => void
  onDecline?: () => void
}) {
  const { t } = useTranslation()
  const sections = t('legal.sections', { returnObjects: true }) as LegalSection[]

  // When acceptance is mandatory the dialog cannot be dismissed by clicking
  // outside, pressing Escape, or the close button — only Accept/Decline.
  const blockClose = requireAccept

  return (
    <Dialog open={open} onOpenChange={blockClose ? undefined : onOpenChange}>
      <DialogContent
        className={cn(
          'pointer-events-auto max-w-2xl',
          blockClose && '[&>button]:hidden',
        )}
        onInteractOutside={blockClose ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={blockClose ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            {t('legal.privacyTitle')}
          </DialogTitle>
          <DialogDescription>
            {requireAccept ? t('legal.acceptRequired') : t('legal.lastUpdated')}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-3 text-sm text-muted-foreground">
          <div className="space-y-4">
            <p>{t('legal.intro')}</p>
            {Array.isArray(sections) &&
              sections.map((section, i) => (
                <section key={i} className="space-y-1">
                  <h3 className="font-medium text-foreground">{section.title}</h3>
                  <p className="whitespace-pre-line">{section.body}</p>
                </section>
              ))}
          </div>
        </div>

        {requireAccept && (
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onDecline}>
              {t('legal.decline')}
            </Button>
            <Button onClick={onAccept}>{t('legal.accept')}</Button>
          </div>
        )}
=======
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { useLegal, type LegalTab } from '@/store/legal'

type LegalSection = { title: string; body: string }

function LegalDoc({ intro, sectionsKey }: { intro: string; sectionsKey: string }) {
  const { t } = useTranslation()
  const sections = t(sectionsKey, { returnObjects: true }) as LegalSection[]
  return (
    <div className="max-h-[55vh] overflow-y-auto pr-3 text-sm text-muted-foreground">
      <div className="space-y-4">
        <p>{intro}</p>
        {Array.isArray(sections) &&
          sections.map((section, i) => (
            <section key={i} className="space-y-1">
              <h3 className="font-medium text-foreground">{section.title}</h3>
              <p className="whitespace-pre-line">{section.body}</p>
            </section>
          ))}
      </div>
    </div>
  )
}

export default function LegalDialog() {
  const { t } = useTranslation()
  const open = useLegal((s) => s.open)
  const tab = useLegal((s) => s.tab)
  const setOpen = useLegal((s) => s.setOpen)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="pointer-events-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('legal.menuTitle')}</DialogTitle>
          <DialogDescription>{t('legal.lastUpdated')}</DialogDescription>
        </DialogHeader>
        <Tabs
          value={tab}
          onValueChange={(v) => useLegal.setState({ tab: v as LegalTab })}
        >
          <TabsList>
            <TabsTrigger value="privacy">
              <ShieldCheck className="size-4" /> {t('legal.privacyTitle')}
            </TabsTrigger>
            <TabsTrigger value="terms">
              <FileText className="size-4" /> {t('legal.termsTitle')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="privacy">
            <LegalDoc intro={t('legal.privacyIntro')} sectionsKey="legal.privacySections" />
          </TabsContent>
          <TabsContent value="terms">
            <LegalDoc intro={t('legal.termsIntro')} sectionsKey="legal.termsSections" />
          </TabsContent>
        </Tabs>
>>>>>>> 4d157b7 (feat(privacy): Add link privacy to menu and connect page)
      </DialogContent>
    </Dialog>
  )
}
