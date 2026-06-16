import {motion, useDragControls} from 'motion/react'
import { GripHorizontal, X, Loader2, Clock } from 'lucide-react'
import { ScrollArea } from '@/ui/shadcn/scroll-area.tsx'
import { Card } from '@/ui/shadcn/card.tsx'
import { Button } from '@/ui/shadcn/button.tsx'
import { useLookupStore } from '@/store/lookupStore'
import UserBadge from '@/ui/hud/UserBadge.tsx'
import { BlockPreview } from '@/ui/hud/editor/SearchBlock.tsx'
import { BlockMetadata } from '@/config/block.ts'
import { useIsMobile } from '@/hooks/use-mobile.tsx'
import { useTranslation } from 'react-i18next'

export function LookupBlock() {
  const { t } = useTranslation()
  const { isOpen, isLoading, results, closeLookup } = useLookupStore()

  const blockLabel = (name: string) =>
    t(`blocks.${name}`, { defaultValue: name.replace(/_/g, ' ') })
  const dragControls = useDragControls()
  const isMobile = useIsMobile()

  if (!isOpen) return null

  return (
    <div className="
      /* Desktop (Default) */
      absolute top-16 left-16 w-[350px] h-[450px] z-50

      /* Mobile Portrait */
      max-md:fixed max-md:bottom-0 max-md:inset-x-0 max-md:top-auto max-md:left-auto max-md:w-full max-md:h-[60vh]

      /* Mobile/Tablet Landscape */
      max-lg:landscape:fixed max-lg:landscape:top-0 max-lg:landscape:bottom-0 max-lg:landscape:right-0 max-lg:landscape:left-auto max-lg:landscape:w-[320px] max-lg:landscape:h-full
    ">
      <motion.div
        key={isMobile ? 'mobile' : 'desktop'}
        drag={!isMobile}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        className="
          flex flex-col h-full w-full p-4 pointer-events-auto
          bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
          shadow-lg

          /* Desktop */
          rounded-xl border border-border/40

          /* Mobile Portrait */
          max-md:rounded-t-2xl max-md:rounded-b-none max-md:border-t max-md:border-x-0 max-md:border-b-0

          /* Mobile Landscape */
          max-lg:landscape:rounded-l-2xl max-lg:landscape:rounded-r-none max-lg:landscape:border-l max-lg:landscape:border-y-0 max-lg:landscape:border-r-0
        "
      >
        {/* Visual Handle for bottom sheet - Only visible on Mobile Portrait */}
        <div className="hidden max-md:portrait:block w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto -mt-1 mb-2" />

        <div className="flex flex-col space-y-2 mb-4">
          <div
            className={`flex items-center justify-between pb-1 ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}`}
            onPointerDown={(e) => !isMobile && dragControls.start(e)}
          >
            <div className="flex items-center gap-2">
              {!isMobile && <GripHorizontal className="h-5 w-5 text-muted-foreground" />}
              <h2 className="text-lg font-bold select-none">{t('editor.history.title')}</h2>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={closeLookup}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">{t('editor.history.fetching')}</p>
            </div>
          ) : results && results.length > 0 ? (
            <div className="flex flex-col gap-3 pr-3">
              {results.map((record, i) => {                const blockMeta = record.placedBlock ? BlockMetadata[record.placedBlock as keyof typeof BlockMetadata] : null;
                const prevBlockMeta = record.previousBlock ? BlockMetadata[record.previousBlock as keyof typeof BlockMetadata] : null;

                return (
                  <Card key={i} className="flex flex-row items-center justify-between p-3 gap-2 bg-muted/30">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <UserBadge user={{
                                username: record.userName || t('editor.history.deletedAccount'),
                                userId: record.userId,
                                avatar: record.userAvatar,
                                email: null,
                                role: 'USER',
                                campusId: null
                            }}/>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{new Date(record.date).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 bg-background/40 p-1 rounded-lg border border-border/40 shadow-inner">
                      {/* Previous block state */}
                      <div
                        className="flex items-center justify-center h-10 w-10 rounded-md border border-dashed border-muted-foreground/30 shadow-sm overflow-hidden relative bg-muted/10"
                        title={prevBlockMeta ? `${t('common.before', { defaultValue: 'Before' })}: ${blockLabel(prevBlockMeta.name)}` : `${t('common.before', { defaultValue: 'Before' })}: ${t('editor.air')}`}
                      >
                        {prevBlockMeta ? (
                          <div className="absolute inset-0 flex items-center justify-center scale-75">
                            <BlockPreview
                              name={prevBlockMeta.name}
                              color={prevBlockMeta.color}
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-muted-foreground/50 select-none">{t('editor.air')}</span>
                        )}
                      </div>

                      {/* Transition arrow */}
                      <span className="text-muted-foreground/50 text-xs font-bold px-0.5 select-none">➔</span>

                      {/* New placed block state */}
                      <div
                        className="flex items-center justify-center h-10 w-10 rounded-md border border-border shadow-sm overflow-hidden relative bg-background"
                        title={blockMeta ? `${t('common.after', { defaultValue: 'After' })}: ${blockLabel(blockMeta.name)}` : `${t('common.after', { defaultValue: 'After' })}: ${t('editor.air')}`}
                      >
                        {blockMeta ? (
                          <div className="absolute inset-0 flex items-center justify-center scale-75">
                            <BlockPreview name={blockMeta.name} color={blockMeta.color} />
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-muted-foreground/50 select-none">{t('editor.air')}</span>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : results === null ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
              <Clock className="h-8 w-8 text-muted-foreground/50 animate-pulse" />
              <p className="text-muted-foreground text-sm px-4">{t('editor.history.empty')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
              <Clock className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">{t('editor.history.none')}</p>
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </div>
  )
}