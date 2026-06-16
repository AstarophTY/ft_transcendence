import { create } from 'zustand'
import { Block } from '@/types/block.ts'
import { Tab, Shape } from '@/types/editor.ts'
import { useLookupStore } from '@/store/lookupStore'
import {EditorStore} from "@/types/store/editorStore.ts";

export const useEditorStore = create<EditorStore>((set) => ({
  inClaimZone: false,
  setClaimZone: (state) => set({ inClaimZone: state}),
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
  shapeSizeX: 1,
  shapeSizeY: 1,
  shapeSizeZ: 1,
  setShapeSizeX: (shape_size) => set({shapeSizeX: shape_size}),
  setShapeSizeY: (shape_size) => set({shapeSizeY: shape_size}),
  setShapeSizeZ: (shape_size) => set({shapeSizeZ: shape_size}),
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
