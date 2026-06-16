import { create } from 'zustand'

import { getMe } from '@/lib/api/account.ts'
import { DEFAULT_SKIN_COLOR } from '@/config/playerAppearance'

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
