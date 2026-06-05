import { motion, useDragControls } from 'motion/react'
import { GripHorizontal, X, Loader2, Clock } from 'lucide-react'
import { ScrollArea } from '@/components/shadcn/scroll-area'
import { Card } from '@/components/shadcn/card'
import { Button } from '@/components/shadcn/button'
import { useLookupStore } from '@/store/lookupStore'
import UserBadge from '@/components/hud/UserBadge'
import { BlockPreview } from '@/components/hud/editor/SearchBlock'
import { BlockMetadata } from '@/config/Block'

export function LookupBlock() {
  const { isOpen, isLoading, results, closeLookup } = useLookupStore()
  const dragControls = useDragControls()

  if (!isOpen) return null

  return (
    <div className="absolute top-16 left-16 w-[350px] h-[450px] z-50">
      <motion.div 
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        className="flex flex-col h-full w-full p-4 pointer-events-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-xl border shadow-lg"
      >
        <div className="flex flex-col space-y-2 mb-4">
          <div 
            className="flex items-center justify-between cursor-grab active:cursor-grabbing pb-1"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-bold select-none">Block History</h2>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeLookup}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Fetching block history...</p>
            </div>
          ) : results && results.length > 0 ? (
            <div className="flex flex-col gap-3 pr-3">
              {results.map((record, i) => {
                const blockMeta = record.placedBlock ? BlockMetadata[record.placedBlock as keyof typeof BlockMetadata] : null;
                
                return (
                  <Card key={i} className="flex flex-row items-center justify-between p-3 gap-2 bg-muted/30">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <UserBadge user={{
                                username: record.userName,
                                userId: record.userId,
                                avatar: record.userAvatar,
                                email: null,
                                role: 'USER',
                                campusId: null
                            }}/>
                        <span className="font-semibold text-sm">{record.userName || record.userId}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{new Date(record.date).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center h-12 w-12 bg-background rounded-md border shadow-sm shrink-0 overflow-hidden relative" title={blockMeta ? blockMeta.name : "Air"}>
                      {blockMeta ? (
                        <div className="absolute inset-0 flex items-center justify-center scale-75">
                          <BlockPreview name={blockMeta.name} color={blockMeta.color} />
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">Air</span>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
              <Clock className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">No history found for this block.</p>
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </div>
  )
}