import {Block} from "@/types/block.ts";
import {Shape, Tab} from "@/types/editor.ts";

export interface EditorStore {
    inClaimZone: boolean
    setClaimZone: (state: boolean) => void
    in_editor: boolean
    activeEditor: (state: boolean) => void
    selectedBlock: Block
    setSelectedBlock: (block: Block) => void
    tool: Tab
    setTool: (tool: Tab) => void
    shape: Shape
    setShape: (shape: Shape) => void
    shapeSizeX: number
    setShapeSizeX: (shapeSize: number) => void
    shapeSizeY: number
    setShapeSizeY: (shapeSize: number) => void
    shapeSizeZ: number
    setShapeSizeZ: (shapeSize: number) => void
    catalogOpen: boolean
    setCatalogOpen: (open: boolean) => void
}