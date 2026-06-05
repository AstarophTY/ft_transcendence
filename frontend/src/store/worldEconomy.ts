import { create } from 'zustand'

interface WorldEconomyState {
  /** Build budget (coins) of the campus world currently being edited. */
  coins: number
  setCoins: (coins: number) => void
  /** Optimistic local adjustment; the server's `world:coins` later corrects it. */
  adjust: (delta: number) => void
}

export const useWorldEconomy = create<WorldEconomyState>((set) => ({
  coins: 0,
  setCoins: (coins) => set({ coins }),
  adjust: (delta) => set((s) => ({ coins: Math.max(0, s.coins + delta) })),
}))
