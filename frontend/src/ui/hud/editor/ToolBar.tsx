import { LayersPlus, LayersMinus, Rotate3D, Box, Circle } from 'lucide-react'
import { Button } from '@/ui/shadcn/button.tsx'
import { ToolBarProps } from "@/types/Editor.ts"
import { Tab, Shape } from "@/types/Editor.ts"

function ShortcutKey({ k }: { k: string }) {
  return (
    <kbd className="pointer-events-none hidden lg:inline-flex h-5 w-5 select-none items-center justify-center rounded border bg-muted font-mono text-[10px] font-medium text-muted-foreground">
      {k}
    </kbd>
  )
}

export default function ToolBar({ updateCurrenTool, currentTool, updateCurrentShape, currentShape }: ToolBarProps) {
  return (
    <div
      className="z-50 flex flex-col gap-3 p-3 border rounded-xl bg-card text-card-foreground shadow-md absolute left-10 top-1/2 -translate-y-1/2
                 /* Mobile Portrait Override: horizontal bottom bar, glued to edge */
                 max-md:portrait:fixed max-md:portrait:bottom-0 max-md:portrait:left-0 max-md:portrait:right-0 max-md:portrait:top-auto max-md:portrait:translate-y-0 max-md:portrait:w-full max-md:portrait:h-auto max-md:portrait:flex-row max-md:portrait:justify-center max-md:portrait:gap-4 max-md:portrait:p-2 max-md:portrait:border-t max-md:portrait:border-x-0 max-md:portrait:border-b-0 max-md:portrait:rounded-none max-md:portrait:shadow-none
                 /* Mobile Landscape Override: vertical left bar, glued to edge */
                 max-lg:landscape:fixed max-lg:landscape:left-0 max-lg:landscape:top-0 max-lg:landscape:bottom-0 max-lg:landscape:translate-y-0 max-lg:landscape:h-full max-lg:landscape:w-auto max-lg:landscape:flex-col max-lg:landscape:justify-center max-lg:landscape:gap-4 max-lg:landscape:p-2 max-lg:landscape:border-r max-lg:landscape:border-y-0 max-lg:landscape:border-l-0 max-lg:landscape:rounded-none max-lg:landscape:shadow-none"
    >
      <div className="flex items-center lg:gap-3">
        <Button variant='default' size='icon' onClick={updateCurrentShape}>
          {currentShape === Shape.Cube ? <Box /> : <Circle />}
        </Button>
        <ShortcutKey k="1" />
      </div>
      
      <div className="flex items-center lg:gap-3">
        <Button variant={currentTool === Tab.Add ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.Add)}>
          <LayersPlus />
        </Button>
        <ShortcutKey k="2" />
      </div>

      <div className="flex items-center lg:gap-3">
        <Button variant={currentTool === Tab.Remove ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.Remove)}>
          <LayersMinus />
        </Button>
        <ShortcutKey k="3" />
      </div>

      <div className="flex items-center lg:gap-3">
        <Button variant={currentTool === Tab.RotateX ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.RotateX)} className="relative">
          <Rotate3D className="h-4 w-4" />
          <span className={`absolute bottom-0.5 right-1 text-[9px] font-extrabold select-none ${currentTool === Tab.RotateX ? 'text-primary-foreground' : 'text-muted-foreground'}`}>X</span>
        </Button>
        <ShortcutKey k="4" />
      </div>

      <div className="flex items-center lg:gap-3">
        <Button variant={currentTool === Tab.RotateY ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.RotateY)} className="relative">
          <Rotate3D className="h-4 w-4" />
          <span className={`absolute bottom-0.5 right-1 text-[9px] font-extrabold select-none ${currentTool === Tab.RotateY ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Y</span>
        </Button>
        <ShortcutKey k="5" />
      </div>

      <div className="flex items-center lg:gap-3">
        <Button variant={currentTool === Tab.RotateZ ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.RotateZ)} className="relative">
          <Rotate3D className="h-4 w-4" />
          <span className={`absolute bottom-0.5 right-1 text-[9px] font-extrabold select-none ${currentTool === Tab.RotateZ ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Z</span>
        </Button>
        <ShortcutKey k="6" />
      </div>
    </div>
  )
}
