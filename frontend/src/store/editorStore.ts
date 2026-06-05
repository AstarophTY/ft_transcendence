import { create } from 'zustand'
import { Block } from '@/types/Block'
import { Tab, Shape } from '@/types/Editor'

interface EditorStore {
  in_editor: boolean
  activeEditor: (state: boolean) => void
  selectedBlock: Block
  setSelectedBlock: (block: Block) => void
  tool: Tab
  setTool: (tool: Tab) => void
  shape: Shape
  setShape: (shape: Shape) => void
  shapeSize: number
  setShapeSize: (shapeSize: number) => void
  catalogOpen: boolean
  setCatalogOpen: (open: boolean) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  in_editor: false,
  activeEditor: (state) => set({ in_editor: state }),
  selectedBlock: Block.Dirt,
  setSelectedBlock: (block) => set({ selectedBlock: block }),
  tool: Tab.None,
  setTool: (tool) => set((state) => ({ 
    tool: tool, 
    catalogOpen: tool === Tab.Add ? true : state.catalogOpen 
  })),
  shape: Shape.Cube,
  setShape: (shape) => set({shape: shape}),
  shapeSize: 1,
  setShapeSize: (shape_size) => set({shapeSize: shape_size}),
  catalogOpen: false,
  setCatalogOpen: (open) => set({ catalogOpen: open })
}))
