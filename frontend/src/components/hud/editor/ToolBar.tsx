import { LayersPlus, LayersMinus, Rotate3D } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { Card } from '@/components/shadcn/card'
import { ToolBarProps } from "@/types/Editor"
import { Tab } from "@/types/Editor"

export default function ToolBar({ updateCurrenTool, currentTool }: ToolBarProps) {
  return <>
    <div className='absolute left-10 flex top-[50%] -translate-y-1/2 justify-center items-center'>
      <Card className='px-4 py-3 flex flex-col gap-3'>
        <Button variant={currentTool === Tab.Add ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.Add)}>
          <LayersPlus />
        </Button>
        <Button variant={currentTool === Tab.Remove ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.Remove)}>
          <LayersMinus />
        </Button>
        <Button variant={currentTool === Tab.RotateX ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.RotateX)} className="relative">
          <Rotate3D className="h-4 w-4" />
          <span className={`absolute bottom-0.5 right-1 text-[9px] font-extrabold select-none ${currentTool === Tab.RotateX ? 'text-primary-foreground' : 'text-muted-foreground'}`}>X</span>
        </Button>
        <Button variant={currentTool === Tab.RotateY ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.RotateY)} className="relative">
          <Rotate3D className="h-4 w-4" />
          <span className={`absolute bottom-0.5 right-1 text-[9px] font-extrabold select-none ${currentTool === Tab.RotateY ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Y</span>
        </Button>
        <Button variant={currentTool === Tab.RotateZ ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool(Tab.RotateZ)} className="relative">
          <Rotate3D className="h-4 w-4" />
          <span className={`absolute bottom-0.5 right-1 text-[9px] font-extrabold select-none ${currentTool === Tab.RotateZ ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Z</span>
        </Button>
      </Card>
    </div>
  </>
}
