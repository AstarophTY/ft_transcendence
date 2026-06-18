import { create } from 'zustand'

interface SceneStore {
  activeSceneId: string
  setScene: (id: string) => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  activeSceneId: 'default',
  setScene: (id) => set({ activeSceneId: id }),
}))
