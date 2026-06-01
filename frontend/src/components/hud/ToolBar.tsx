import { Layers, LayersPlus, LayersMinus } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { Card } from '@/components/shadcn/card'


export default function ToolBar() {
	// const readOnly = useEditorStore((s) => s.readOnly);

	// const currentTool = useEditorStore((s) => s.currentTool);
	// const setTool = useEditorStore((s) => s.setTool);
	const currentTool: string = "select"
	// if (readOnly)
	// 	return null;

	return <>
		<div className='absolute left-10 flex  h-full justify-center items-center '>
			<Card className='px-4 py-3 flex-col gap-3'>
				<Button variant={currentTool === 'select' ? 'default' : 'outline'} size='icon'>
					<Layers />
				</Button>
				<Button variant={currentTool === 'connection' ? 'default' : 'outline'} size='icon'>
					<LayersPlus />
				</Button>
				<Button variant={currentTool === 'node' ? 'default' : 'outline'} size='icon'>
					<LayersMinus />
				</Button>
			</Card>
		</div>
	</>
}