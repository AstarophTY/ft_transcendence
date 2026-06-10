import { create } from 'zustand'

import type { CampusWorld } from '@/lib/api/world'

interface PlanetStore {
  /** One world per campus, loaded from the backend. */
  worlds: CampusWorld[]
  setWorlds: (worlds: CampusWorld[]) => void
  planetCount: number
  setPlanetCount: (count: number) => void
  targetOffset: number
  setTargetOffset: (offset: number) => void
  activeIndex: number
  setActiveIndex: (index: number) => void
  /** Campus id of the currently selected world, or null while none is loaded. */
  activeCampusId: string | null
  setCampusId: (id: string | null) => void
  isPrivateWorld: boolean
  setIsPrivateWorld: (isPrivate: boolean) => void
  privatePlanetPos: [number, number, number] | null
  setPrivatePlanetPos: (pos: [number, number, number] | null) => void
  sceneMode: 'selection' | 'zooming' | 'zooming-private' | 'world'
  setSceneMode: (mode: 'selection' | 'zooming' | 'zooming-private' | 'world') => void
  /** True while the takeoff transition (world -> selection) is in progress. */
  isTakingOff: boolean
  setTakingOff: (value: boolean) => void
  renderDistance: number
  setRenderDistance: (dist: number) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  contests: unknown[]
  setContests: (state: unknown[]) => void
}

const getInitialRenderDistance = () => {
  const stored = localStorage.getItem('renderDistance')
  if (stored) {
    const val = parseInt(stored, 10)
    if (!isNaN(val)) return val
  }
  return 12 // Default render distance matching the constants
}

const campusIdAt = (worlds: CampusWorld[], index: number): string | null =>
  worlds[index]?.campusId ?? null

export const usePlanetStore = create<PlanetStore>((set, get) => ({
  worlds: [],
  setCampusId: (id) => set({ activeCampusId: id }),
  setWorlds: (worlds) => {
    const activeIndex = worlds.length > 0 ? Math.floor(worlds.length / 2) : 0
    set({
      worlds,
      planetCount: worlds.length,
      activeIndex,
      targetOffset: worlds.length > 1 ? activeIndex / (worlds.length - 1) : 0,
      activeCampusId: campusIdAt(worlds, activeIndex),
    })
  },
  planetCount: 0,
  setPlanetCount: (count) => set({ planetCount: count }),
  activeIndex: 0,
  setActiveIndex: (index) =>
    set({ activeIndex: index, activeCampusId: campusIdAt(get().worlds, index) }),
  isPrivateWorld: false,
  setIsPrivateWorld: (isPrivate) => set({ isPrivateWorld: isPrivate }),
  privatePlanetPos: null,
  setPrivatePlanetPos: (pos) => set({ privatePlanetPos: pos }),
  targetOffset: 0,
  setTargetOffset: (offset) => set({ targetOffset: offset }),
  activeCampusId: null,
  sceneMode: 'selection',
  setSceneMode: (mode) => {
    if (mode === 'selection') {
      const { worlds, activeIndex } = get()
      set({
        sceneMode: mode,
        isPrivateWorld: false,
        privatePlanetPos: null,
        targetOffset: worlds.length > 1 ? activeIndex / (worlds.length - 1) : 0,
      })
    } else {
      set({ sceneMode: mode })
    }
  },
  isTakingOff: false,
  setTakingOff: (value) => set({ isTakingOff: value }),
  renderDistance: getInitialRenderDistance(),
  setRenderDistance: (dist) => {
    localStorage.setItem('renderDistance', dist.toString())
    set({ renderDistance: dist })
  },
  theme: localStorage.getItem('theme') === 'light' ? 'light' : 'dark',
  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
    set({ theme })
  },
  contests: [],
  setContests: (state) => set({ contests: state }),
}))
