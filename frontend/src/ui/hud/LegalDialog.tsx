import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
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
      </DialogContent>
    </Dialog>
  )
}
