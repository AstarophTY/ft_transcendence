import { LayersPlus, LayersMinus, Search } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { Card } from '@/components/shadcn/card'
import { ToolBarProps } from "@/types/Editor"

export default function ToolBar({ updateCurrenTool, currentTool }: ToolBarProps) {
  return <>
    <div className='absolute left-10 flex top-[50%] -translate-y-1/2 justify-center items-center'>
      <Card className='px-4 py-3 flex flex-col gap-3'>
        <Button variant={currentTool === 'search' ? 'default' : 'outline'} size='icon' onClick={() => updateCurrenTool("search")}>
				  <Search />
        </Button>
        <Button variant={currentTool === 'add' ? 'default' : 'outline'} size='icon'>
          <LayersPlus />
        </Button>
        <Button variant={currentTool === 'remove' ? 'default' : 'outline'} size='icon'>
          <LayersMinus />
        </Button>
      </Card>
    </div>
  </>
}
