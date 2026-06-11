import { create } from 'zustand'

import { listWorlds, type CampusWorld } from '@/lib/api/world'

interface PlanetStore {
  /** One world per campus, loaded from the backend. */
  worlds: CampusWorld[]
  setWorlds: (worlds: CampusWorld[]) => void
  /** Refetch worlds (new seeds after a season reset), keeping the current selection. */
  reloadWorlds: () => Promise<void>
  /** Bumped on a world reset to force the active world to reload its blocks. */
  worldEpoch: number
  /** Fly into a campus world (used by the season podium "visit" action). */
  visitCampus: (campusId: string) => void
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
  /** When set, the world scene shows this user's personal island (read-only if not self). */
  visitUserId: string | null
  setVisitUserId: (id: string | null) => void
  /** Jump straight into a user's personal island to look around it. */
  visitIsland: (userId: string) => void
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
  worldEpoch: 0,
  reloadWorlds: async () => {
    try {
      const worlds = await listWorlds()
      const { activeCampusId } = get()
      const found = activeCampusId
        ? worlds.findIndex((w) => w.campusId === activeCampusId)
        : -1
      const activeIndex =
        found >= 0 ? found : worlds.length > 0 ? Math.floor(worlds.length / 2) : 0
      set((s) => ({
        worlds,
        planetCount: worlds.length,
        activeIndex,
        activeCampusId: campusIdAt(worlds, activeIndex),
        targetOffset: worlds.length > 1 ? activeIndex / (worlds.length - 1) : 0,
        worldEpoch: s.worldEpoch + 1,
      }))
    } catch {
      /* keep the current worlds if the reload fails */
    }
  },
  visitCampus: (campusId) => {
    const { worlds } = get()
    const index = worlds.findIndex((w) => w.campusId === campusId)
    if (index < 0) return
    set({
      activeIndex: index,
      activeCampusId: campusId,
      targetOffset: worlds.length > 1 ? index / (worlds.length - 1) : 0,
      isPrivateWorld: false,
      visitUserId: null,
      privatePlanetPos: null,
      sceneMode: 'zooming',
    })
  },
  planetCount: 0,
  setPlanetCount: (count) => set({ planetCount: count }),
  activeIndex: 0,
  setActiveIndex: (index) =>
    set({ activeIndex: index, activeCampusId: campusIdAt(get().worlds, index) }),
  isPrivateWorld: false,
  setIsPrivateWorld: (isPrivate) => set({ isPrivateWorld: isPrivate }),
  visitUserId: null,
  setVisitUserId: (id) => set({ visitUserId: id }),
  visitIsland: (userId) =>
    set({
      visitUserId: userId,
      isPrivateWorld: true,
      privatePlanetPos: null,
      sceneMode: 'world',
    }),
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
        visitUserId: null,
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
}))
