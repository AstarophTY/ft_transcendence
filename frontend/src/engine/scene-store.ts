import { create } from 'zustand'

interface SceneStore {
  activeSceneId: string
  setScene: (id: string) => void
  guiOpen: boolean
  setGuiOpen: (open: boolean) => void
  toggleGui: () => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  activeSceneId: 'default',
  setScene: (id) => set({ activeSceneId: id }),
  guiOpen: false,
  setGuiOpen: (open) => set({ guiOpen: open }),
  toggleGui: () => set((s) => ({ guiOpen: !s.guiOpen })),
}))
