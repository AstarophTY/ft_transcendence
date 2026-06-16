import { create } from 'zustand'

import { listWorlds } from '@/lib/api/world'
import {CampusWorld} from "@/types/api/world.ts";
import {PlanetStore} from "@/types/store/planetStore.ts";

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
  showTutorial: localStorage.getItem('ft_has_seen_tutorial') !== 'true',
  setShowTutorial: (show) => set({ showTutorial: show }),
}))
