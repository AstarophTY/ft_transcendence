import { create } from 'zustand'

interface WorldEconomyState {
  /** Build budget of the current campus. null = not yet received from server. */
  coins: number | null
  setCoins: (coins: number) => void
  /** Reset to unknown state when joining a new campus. */
  reset: () => void
  /** Optimistic local adjustment; the server's `world:coins` later corrects it. */
  adjust: (delta: number) => void
}

export const useWorldEconomy = create<WorldEconomyState>((set) => ({
  coins: null,
  setCoins: (coins) => set({ coins }),
  reset: () => set({ coins: null }),
  adjust: (delta) => set((s) => ({
    coins: s.coins === null ? null : Math.max(0, s.coins + delta),
  })),
}))
