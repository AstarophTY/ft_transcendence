import Cross from "@/ui/hud/editor/Cross.tsx"
import ToolBar from "@/ui/hud/editor/ToolBar.tsx"
import { SearchBlock, BlockPreview } from "@/ui/hud/editor/SearchBlock.tsx"
import { Tab, Shape } from "@/types/Editor.ts"
import { useEditorStore } from '@/store/editorStore.ts'
import { useHotkeys } from 'react-hotkeys-hook'
import { BlockMetadata } from "@/config/Block.ts"
import { Block } from "@/types/Block.ts"
import { ChevronDown } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile.tsx"

export default function EditorMode() {
  const currentTool = useEditorStore((state) => state.tool)
  const setCurrentTool = useEditorStore((state) => state.setTool)
  const currentShape = useEditorStore((state) => state.shape)
  const setCurrentShape = useEditorStore((state) => state.setShape)
  
  const catalogOpen = useEditorStore((state) => state.catalogOpen)
  const setCatalogOpen = useEditorStore((state) => state.setCatalogOpen)
  const selectedBlock = useEditorStore((state) => state.selectedBlock)
  const isMobile = useIsMobile()

  const changeTool = (tool: Tab) => {
    setCurrentTool(tool === currentTool ? Tab.None : tool)
  }
  const changeShape = () => {
    setCurrentShape(currentShape === Shape.Cube ? Shape.Sphere : Shape.Cube)
  }
  useHotkeys('1', () => changeShape())
  useHotkeys('2', () => changeTool(Tab.Add))
  useHotkeys('3', () => changeTool(Tab.Remove))
  useHotkeys('4', () => changeTool(Tab.RotateX))
  useHotkeys('5', () => changeTool(Tab.RotateY))
  useHotkeys('6', () => changeTool(Tab.RotateZ))
  useHotkeys('escape', () => changeTool(Tab.None))

  const blockMeta = BlockMetadata[selectedBlock as Exclude<Block, Block.Air>]
  const selectedBlockName = blockMeta?.name || 'unknown'
  const selectedBlockColor = blockMeta?.color || '#ffffff'

  return (
      <>
        <ToolBar updateCurrenTool={changeTool} currentTool={currentTool} updateCurrentShape={changeShape} currentShape={currentShape}/>
        <Cross />
        {currentTool === Tab.Add && (!isMobile || catalogOpen) && (<SearchBlock />)}
        
        {/* Floating selected block preview / reopen catalog button */}
        {isMobile && currentTool === Tab.Add && !catalogOpen && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCatalogOpen(true)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 pointer-events-auto bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/40 border border-border/30 rounded-full shadow-lg hover:bg-background/80 active:scale-95 transition-all select-none cursor-pointer"
          >
            <div className="w-6 h-6 flex items-center justify-center bg-muted/10 rounded overflow-hidden">
              <BlockPreview name={selectedBlockName} color={selectedBlockColor} />
            </div>
            <span className="text-xs font-bold text-foreground capitalize">
              {selectedBlockName.replace(/_/g, ' ')}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
    </>
  )
}
