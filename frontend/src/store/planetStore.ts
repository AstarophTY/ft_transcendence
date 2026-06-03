import { create } from 'zustand'

interface PlanetStore {
  planetCount: number
  setPlanetCount: (count: number) => void
  targetOffset: number
  setTargetOffset: (offset: number) => void
  activeIndex: number
  setActiveIndex: (index: number) => void
  sceneMode: 'selection' | 'zooming' | 'world'
  setSceneMode: (mode: 'selection' | 'zooming' | 'world') => void
  renderDistance: number
  setRenderDistance: (dist: number) => void
}

const initialPlanetCount = 10
const initialActiveIndex = 5

const getInitialRenderDistance = () => {
  const stored = localStorage.getItem('renderDistance')
  if (stored) {
    const val = parseInt(stored, 10)
    if (!isNaN(val)) return val
  }
  return 12 // Default render distance matching the constants
}

export const usePlanetStore = create<PlanetStore>((set) => ({
  planetCount: initialPlanetCount,
  setPlanetCount: (count) => set({ planetCount: count }),
  activeIndex: initialActiveIndex,
  setActiveIndex: (index) => set({ activeIndex: index }),
  targetOffset: initialActiveIndex / (initialPlanetCount - 1),
  setTargetOffset: (offset) => set({ targetOffset: offset }),
  sceneMode: 'selection',
  setSceneMode: (mode) => set({ sceneMode: mode }),
  renderDistance: getInitialRenderDistance(),
  setRenderDistance: (dist) => {
    localStorage.setItem('renderDistance', dist.toString())
    set({ renderDistance: dist })
  },
}))
