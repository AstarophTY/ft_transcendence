import { create } from 'zustand'
import {WorldEconomyState} from "@/types/store/worldEconomy.ts";

export const useWorldEconomy = create<WorldEconomyState>((set) => ({
  coins: null,
  setCoins: (coins) => set({ coins }),
  reset: () => set({ coins: null }),
  adjust: (delta) => set((s) => ({
    coins: s.coins === null ? null : Math.max(0, s.coins + delta),
  })),
}))
