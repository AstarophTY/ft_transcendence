import { create } from 'zustand'

interface PlanetStore {
  planetCount: number
  setPlanetCount: (count: number) => void
  targetOffset: number
  setTargetOffset: (offset: number) => void
  activeIndex: number
  setActiveIndex: (index: number) => void
}

export const usePlanetStore = create<PlanetStore>((set) => ({
  planetCount: 10,
  setPlanetCount: (count) => set({ planetCount: count }),
  targetOffset: 0.5,
  setTargetOffset: (offset) => set({ targetOffset: offset }),
  activeIndex: 5,
  setActiveIndex: (index) => set({ activeIndex: index }),
}))
