import { create } from 'zustand';
import { Block } from '../models/Block';

interface EditorStore {
  selectedBlock: Block;
  setSelectedBlock: (block: Block) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  selectedBlock: Block.Stone,
  setSelectedBlock: (block) => set({ selectedBlock: block }),
}));
