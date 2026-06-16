import { useTranslation } from 'react-i18next'
import { ShieldCheck, FileText } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { useLegal } from '@/store/legal'
import {LegalSection} from "@/types/hud/legalSection.ts";
import {LegalTab} from "@/types/store/legal.ts";

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
          onValueChange={(v) => useLegal.setState({
            open: false,
            openLegal: undefined,
            setOpen: undefined,
            tab: v as LegalTab })}
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
      </DialogContent>
    </Dialog>
  )
}
