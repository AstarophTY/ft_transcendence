import { create } from 'zustand'
import { Block } from '@/types/Block'
import { Tab, Shape } from '@/types/Editor'
import { useLookupStore } from './lookupStore'

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
  setTool: (tool) => set((state) => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches || 
                     window.matchMedia("(max-width: 1023px) and (orientation: landscape)").matches
    const nextCatalogOpen = tool === Tab.Add 
      ? true 
      : (isMobile ? false : state.catalogOpen)
      
    if (tool === Tab.Add && isMobile) {
      useLookupStore.getState().closeLookup()
    }

    if (tool === Tab.Lookup) {
      useLookupStore.getState().openLookup(false)
    } else {
      useLookupStore.getState().closeLookup()
    }
    
    return { 
      tool: tool, 
      catalogOpen: nextCatalogOpen 
    }
  }),
  shape: Shape.Cube,
  setShape: (shape) => set({shape: shape}),
  shapeSize: 1,
  setShapeSize: (shape_size) => set({shapeSize: shape_size}),
  catalogOpen: false,
  setCatalogOpen: (open) => {
    if (open) {
      const isMobile = window.matchMedia("(max-width: 767px)").matches || 
                       window.matchMedia("(max-width: 1023px) and (orientation: landscape)").matches
      if (isMobile) {
        useLookupStore.getState().closeLookup()
      }
    }
    set({ catalogOpen: open })
  }
}))
