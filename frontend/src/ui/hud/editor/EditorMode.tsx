import { useState, useEffect } from "react"
import Cross from "@/ui/hud/editor/Cross.tsx"
import ToolBar from "@/ui/hud/editor/ToolBar.tsx"
import { SearchBlock, BlockPreview } from "@/ui/hud/editor/SearchBlock.tsx"
import { Tab, Shape } from "@/types/Editor.ts"
import { useEditorStore } from '@/store/editorStore.ts'
import { useHotkeys } from 'react-hotkeys-hook'
import { BlockMetadata } from "@/config/Block.ts"
import { Block } from "@/types/Block.ts"
import { ChevronDown, Mouse, Minus, Plus } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile.tsx"
import { LookupBlock } from "@/ui/hud/editor/LookupBlock.tsx"
import { useLookupStore } from '@/store/lookupStore.ts'
import { useTranslation } from 'react-i18next'

export default function EditorMode() {
  const { t } = useTranslation()
  const currentTool = useEditorStore((state) => state.tool)
  const setCurrentTool = useEditorStore((state) => state.setTool)
  const currentShape = useEditorStore((state) => state.shape)
  const setCurrentShape = useEditorStore((state) => state.setShape)
  const shapeSizeX = useEditorStore((state) => state.shapeSizeX)
  const shapeSizeY = useEditorStore((state) => state.shapeSizeY)
  const shapeSizeZ = useEditorStore((state) => state.shapeSizeZ)
  const setShapeSizeX = useEditorStore((state) => state.setShapeSizeX)
  const setShapeSizeY = useEditorStore((state) => state.setShapeSizeY)
  const setShapeSizeZ = useEditorStore((state) => state.setShapeSizeZ)
  
  const catalogOpen = useEditorStore((state) => state.catalogOpen)
  const setCatalogOpen = useEditorStore((state) => state.setCatalogOpen)
  const selectedBlock = useEditorStore((state) => state.selectedBlock)
  const isMobile = useIsMobile()
  const [activePicker, setActivePicker] = useState<'X' | 'Y' | 'Z' | null>(null)

  useEffect(() => {
    if (!activePicker) return
    const handleOutsideClick = () => {
      setActivePicker(null)
    }
    const timer = setTimeout(() => {
      window.addEventListener('click', handleOutsideClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('click', handleOutsideClick)
    }
  }, [activePicker])

  const changeTool = (tool: Tab) => {
    setCurrentTool(tool === currentTool ? Tab.None : tool)
  }
  const changeShape = () => {
    setCurrentShape(currentShape === Shape.Cube ? Shape.Sphere : Shape.Cube)
  }
  const resetShapeSize = () => {
    setShapeSizeX(1)
    setShapeSizeY(1)
    setShapeSizeZ(1)
  }
  useHotkeys('1', () => changeShape())
  useHotkeys('2', () => changeTool(Tab.Add))
  useHotkeys('3', () => changeTool(Tab.Remove))
  useHotkeys('4', () => changeTool(Tab.RotateX))
  useHotkeys('5', () => changeTool(Tab.RotateY))
  useHotkeys('6', () => changeTool(Tab.RotateZ))
  useHotkeys('7', () => changeTool(Tab.Lookup))
  useHotkeys('0', () => resetShapeSize())
  useHotkeys('escape', () => {
    changeTool(Tab.None)
    useLookupStore.getState().closeLookup()
  })

  const blockMeta = BlockMetadata[selectedBlock as Exclude<Block, Block.Air>]
  const selectedBlockName = blockMeta?.name || 'unknown'
  const selectedBlockColor = blockMeta?.color || '#ffffff'

  return (
      <>
        <ToolBar updateCurrenTool={changeTool} currentTool={currentTool} updateCurrentShape={changeShape} currentShape={currentShape}/>
        <Cross />
        {currentTool === Tab.Add && (!isMobile || catalogOpen) && (<SearchBlock />)}
        
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
              {blockMeta ? t(`blocks.${selectedBlockName}`, { defaultValue: selectedBlockName.replace(/_/g, ' ') }) : selectedBlockName}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-2 bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/40 border border-border/30 rounded-full shadow-lg select-none pointer-events-auto text-sm font-mono font-bold text-foreground">
          {isMobile ? (
            <>
              {/* X dimension */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivePicker(activePicker === 'X' ? null : 'X')
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all pointer-events-auto cursor-pointer ${
                    activePicker === 'X'
                      ? 'border-pink-500/50 bg-muted/40 shadow-sm'
                      : 'border-border/20 bg-muted/20 hover:border-border/40'
                  }`}
                >
                  <span className="text-pink-500">X</span>
                  <span className="text-foreground">{shapeSizeX}</span>
                </button>

                {activePicker === 'X' && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-2 px-2.5 py-1.5 bg-background/95 backdrop-blur-md border border-border/40 rounded-lg shadow-xl pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-150"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShapeSizeX(Math.max(1, shapeSizeX - 1))
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded bg-muted/40 text-muted-foreground hover:text-foreground active:bg-muted/80 transition-all cursor-pointer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-foreground font-mono font-bold text-center min-w-[20px]">
                      {shapeSizeX}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShapeSizeX(Math.min(5, shapeSizeX + 1))
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded bg-muted/40 text-muted-foreground hover:text-foreground active:bg-muted/80 transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Y dimension */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivePicker(activePicker === 'Y' ? null : 'Y')
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all pointer-events-auto cursor-pointer ${
                    activePicker === 'Y'
                      ? 'border-emerald-500/50 bg-muted/40 shadow-sm'
                      : 'border-border/20 bg-muted/20 hover:border-border/40'
                  }`}
                >
                  <span className="text-emerald-500">Y</span>
                  <span className="text-foreground">{shapeSizeY}</span>
                </button>

                {activePicker === 'Y' && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-2 px-2.5 py-1.5 bg-background/95 backdrop-blur-md border border-border/40 rounded-lg shadow-xl pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-150"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShapeSizeY(Math.max(1, shapeSizeY - 1))
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded bg-muted/40 text-muted-foreground hover:text-foreground active:bg-muted/80 transition-all cursor-pointer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-foreground font-mono font-bold text-center min-w-[20px]">
                      {shapeSizeY}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShapeSizeY(Math.min(5, shapeSizeY + 1))
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded bg-muted/40 text-muted-foreground hover:text-foreground active:bg-muted/80 transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Z dimension */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivePicker(activePicker === 'Z' ? null : 'Z')
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all pointer-events-auto cursor-pointer ${
                    activePicker === 'Z'
                      ? 'border-blue-500/50 bg-muted/40 shadow-sm'
                      : 'border-border/20 bg-muted/20 hover:border-border/40'
                  }`}
                >
                  <span className="text-blue-500">Z</span>
                  <span className="text-foreground">{shapeSizeZ}</span>
                </button>

                {activePicker === 'Z' && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-2 px-2.5 py-1.5 bg-background/95 backdrop-blur-md border border-border/40 rounded-lg shadow-xl pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-150"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShapeSizeZ(Math.max(1, shapeSizeZ - 1))
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded bg-muted/40 text-muted-foreground hover:text-foreground active:bg-muted/80 transition-all cursor-pointer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-foreground font-mono font-bold text-center min-w-[20px]">
                      {shapeSizeZ}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShapeSizeZ(Math.min(5, shapeSizeZ + 1))
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded bg-muted/40 text-muted-foreground hover:text-foreground active:bg-muted/80 transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-pink-500">
                  <Mouse className="h-4 w-4 shrink-0" />
                  <span>X</span>
                </span>
                <span>{shapeSizeX}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-emerald-500">
                  <Mouse className="h-4 w-4 shrink-0" />
                  <span>Y</span>
                </span>
                <span>{shapeSizeY}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-blue-500">
                  <Mouse className="h-4 w-4 shrink-0" />
                  <span>Z</span>
                </span>
                <span>{shapeSizeZ}</span>
              </div>
            </>
          )}
        </div>
        <LookupBlock />
    </>
  )
}
