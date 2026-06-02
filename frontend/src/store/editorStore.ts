import { create } from 'zustand'
import { Block } from '@/types/Block'
import { Tab } from '@/types/Editor'

interface EditorStore {
  selectedBlock: Block
  setSelectedBlock: (block: Block) => void
  tool: Tab
  setTool: (tool: Tab) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  selectedBlock: Block.Dirt,
  setSelectedBlock: (block) => set({ selectedBlock: block }),
  tool: Tab.None,
  setTool: (tool) => set({ tool: tool })
}))
