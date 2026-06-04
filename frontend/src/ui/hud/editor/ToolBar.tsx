import { LayersPlus, LayersMinus, Rotate3D, Box, Circle } from 'lucide-react'
import { Button } from '@/ui/shadcn/button.tsx'
import { Card } from '@/ui/shadcn/card.tsx'
import { ToolBarProps } from "@/types/Editor.ts"
import { Tab, Shape } from "@/types/Editor.ts"

function ShortcutKey({ k }: { k: string }) {
  return (
    <kbd className="pointer-events-none inline-flex h-5 w-5 select-none items-center justify-center rounded border bg-muted font-mono text-[10px] font-medium text-muted-foreground">
      {k}
    </kbd>
  )
}

export default function ToolBar({ updateCurrenTool, currentTool, updateCurrentShape, currentShape }: ToolBarProps) {
  return <>
    <div className='absolute left-10 flex top-[50%] -translate-y-1/2 justify-center items-center'>
      <Card className='p-3 flex flex-col gap-3'>
        <div className="flex items-center gap-3">
          <Button variant='default' size='icon' onClick={updateCurrentShape}>
            {currentShape === Shape.Cube ? <Box /> : <Circle />}
          </Button>
          <ShortcutKey k="1" />
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant={currentTool === Tab.Add ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.Add)}>
            <LayersPlus />
          </Button>
          <ShortcutKey k="2" />
        </div>

        <div className="flex items-center gap-3">
          <Button variant={currentTool === Tab.Remove ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.Remove)}>
            <LayersMinus />
          </Button>
          <ShortcutKey k="3" />
        </div>

        <div className="flex items-center gap-3">
          <Button variant={currentTool === Tab.RotateX ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.RotateX)} className="relative">
            <Rotate3D className="h-4 w-4" />
            <span className={`absolute bottom-0.5 right-1 text-[9px] font-extrabold select-none ${currentTool === Tab.RotateX ? 'text-primary-foreground' : 'text-muted-foreground'}`}>X</span>
          </Button>
          <ShortcutKey k="4" />
        </div>

        <div className="flex items-center gap-3">
          <Button variant={currentTool === Tab.RotateY ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.RotateY)} className="relative">
            <Rotate3D className="h-4 w-4" />
            <span className={`absolute bottom-0.5 right-1 text-[9px] font-extrabold select-none ${currentTool === Tab.RotateY ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Y</span>
          </Button>
          <ShortcutKey k="5" />
        </div>

        <div className="flex items-center gap-3">
          <Button variant={currentTool === Tab.RotateZ ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.RotateZ)} className="relative">
            <Rotate3D className="h-4 w-4" />
            <span className={`absolute bottom-0.5 right-1 text-[9px] font-extrabold select-none ${currentTool === Tab.RotateZ ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Z</span>
          </Button>
          <ShortcutKey k="6" />
        </div>
      </Card>
    </div>
  </>
}
