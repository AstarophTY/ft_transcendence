import { create } from 'zustand'

import { getMe } from '@/lib/account'
import { DEFAULT_SKIN_COLOR } from '@/config/playerAppearance'

interface PlayerAppearanceState {
  /** Local player's avatar tint, shared by the 3D model and the world sync. */
  skinColor: string
  loaded: boolean
  setSkinColor: (color: string) => void
  /** Fetch the saved skin once (no-op afterwards). */
  ensureLoaded: () => Promise<void>
}

export const usePlayerAppearance = create<PlayerAppearanceState>((set, get) => ({
  skinColor: DEFAULT_SKIN_COLOR,
  loaded: false,
  setSkinColor: (skinColor) => set({ skinColor }),
  ensureLoaded: async () => {
    if (get().loaded) return
    set({ loaded: true })
    try {
      const me = await getMe()
      set({ skinColor: me.skinColor ?? DEFAULT_SKIN_COLOR })
    } catch {
      /* keep the default tint if the profile cannot be loaded */
    }
  },
}))
