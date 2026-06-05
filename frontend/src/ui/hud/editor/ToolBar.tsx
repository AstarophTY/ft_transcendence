import { LayersPlus, LayersMinus, Rotate3D, Box, Circle, ScanSearch } from 'lucide-react'
import { Button } from '@/ui/shadcn/button.tsx'
import { ToolBarProps } from "@/types/Editor.ts"
import { Tab, Shape } from "@/types/Editor.ts"
import { cn } from '@/lib/utils.ts'

function ShortcutKey({ k }: { k: string }) {
  return (
    <kbd className="pointer-events-none hidden lg:inline-flex h-5 w-5 select-none items-center justify-center rounded border border-border/30 bg-background/30 backdrop-blur-sm font-mono text-[10px] font-medium text-muted-foreground">
      {k}
    </kbd>
  )
}

export default function ToolBar({ updateCurrenTool, currentTool, updateCurrentShape, currentShape }: ToolBarProps) {
  const getButtonClass = (active: boolean) =>
    cn(
      "border backdrop-blur-xs transition-colors",
      active
        ? "bg-primary/80 hover:bg-primary/95 text-primary-foreground border-primary/30"
        : "bg-background/25 hover:bg-background/45 text-muted-foreground hover:text-foreground border-border/30"
    )

  return (
    <div
      className="z-50 flex flex-col gap-3 p-3 border rounded-xl bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/40 text-card-foreground shadow-md absolute left-10 top-1/2 -translate-y-1/2
                 /* Mobile Portrait Override: horizontal bottom bar, glued to edge */
                 max-md:portrait:fixed max-md:portrait:bottom-0 max-md:portrait:left-0 max-md:portrait:right-0 max-md:portrait:top-auto max-md:portrait:translate-y-0 max-md:portrait:w-full max-md:portrait:h-auto max-md:portrait:flex-row max-md:portrait:justify-center max-md:portrait:gap-4 max-md:portrait:p-2 max-md:portrait:border-t max-md:portrait:border-x-0 max-md:portrait:border-b-0 max-md:portrait:rounded-none max-md:portrait:shadow-none max-md:portrait:bg-background/60 max-md:portrait:backdrop-blur-md max-md:portrait:supports-[backdrop-filter]:bg-background/40
                 /* Mobile Landscape Override: vertical left bar, glued to edge */
                 max-lg:landscape:fixed max-lg:landscape:left-0 max-lg:landscape:top-0 max-lg:landscape:bottom-0 max-lg:landscape:translate-y-0 max-lg:landscape:h-full max-lg:landscape:w-auto max-lg:landscape:flex-col max-lg:landscape:justify-center max-lg:landscape:gap-4 max-lg:landscape:p-2 max-lg:landscape:border-r max-lg:landscape:border-y-0 max-lg:landscape:border-l-0 max-lg:landscape:rounded-none max-lg:landscape:shadow-none max-lg:landscape:bg-background/60 max-lg:landscape:backdrop-blur-md max-lg:landscape:supports-[backdrop-filter]:bg-background/40"
    >
      <div className="flex items-center lg:gap-3">
        <Button variant="ghost" size="icon" className={getButtonClass(true)} onClick={updateCurrentShape}>
          {currentShape === Shape.Cube ? <Box /> : <Circle />}
        </Button>
        <ShortcutKey k="1" />
      </div>
      
      <div className="flex items-center lg:gap-3">
        <Button variant="ghost" size="icon" className={getButtonClass(currentTool === Tab.Add)} onClick={() => updateCurrenTool(Tab.Add)}>
          <LayersPlus />
        </Button>
        <ShortcutKey k="2" />
      </div>

      <div className="flex items-center lg:gap-3">
        <Button variant="ghost" size="icon" className={getButtonClass(currentTool === Tab.Remove)} onClick={() => updateCurrenTool(Tab.Remove)}>
          <LayersMinus />
        </Button>
        <ShortcutKey k="3" />
      </div>

      <div className="flex items-center lg:gap-3">
        <Button variant="ghost" size="icon" className={cn(getButtonClass(currentTool === Tab.RotateX), "relative")} onClick={() => updateCurrenTool(Tab.RotateX)}>
          <Rotate3D className="h-4 w-4" />
          <span className={`absolute bottom-0.5 right-1 text-[9px] font-extrabold select-none ${currentTool === Tab.RotateX ? 'text-primary-foreground' : 'text-muted-foreground'}`}>X</span>
        </Button>
        <ShortcutKey k="4" />
      </div>

      <div className="flex items-center lg:gap-3">
        <Button variant="ghost" size="icon" className={cn(getButtonClass(currentTool === Tab.RotateY), "relative")} onClick={() => updateCurrenTool(Tab.RotateY)}>
          <Rotate3D className="h-4 w-4" />
          <span className={`absolute bottom-0.5 right-1 text-[9px] font-extrabold select-none ${currentTool === Tab.RotateY ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Y</span>
        </Button>
        <ShortcutKey k="5" />
      </div>

      <div className="flex items-center lg:gap-3">
        <Button variant="ghost" size="icon" className={cn(getButtonClass(currentTool === Tab.RotateZ), "relative")} onClick={() => updateCurrenTool(Tab.RotateZ)}>
          <Rotate3D className="h-4 w-4" />
          <span className={`absolute bottom-0.5 right-1 text-[9px] font-extrabold select-none ${currentTool === Tab.RotateZ ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Z</span>
        </Button>
        <ShortcutKey k="6" />
      </div>

      <div className="flex items-center lg:gap-3">
        <Button variant="ghost" size="icon" className={getButtonClass(currentTool === Tab.Lookup)} onClick={() => updateCurrenTool(Tab.Lookup)}>
          <ScanSearch className="h-4 w-4" />
        </Button>
        <ShortcutKey k="7" />
      </div>
    </div>
  )
}
