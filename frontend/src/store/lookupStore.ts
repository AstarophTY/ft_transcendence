importinterface WorldEconomyState {
  /** Build budget of the current campus. null = not yet received from server. */
  coins: number | null
  setCoins: (coins: number) => void
  /** Reset to unknown state when joining a new campus. */
  reset: () => void
  /** Optimistic local adjustment; the server's `world:coins` later corrects it. */
  adjust: (delta: number) => void
} { create } from 'zustand'
import {LookupState} from "@/types/store/lookupStore.ts";

export const useLookupStore = create<LookupState>((set) => ({
  isOpen: false,
  isLoading: false,
  results: null,
  openLookup: (loading = true) => set({ isOpen: true, isLoading: loading, results: null }),
  closeLookup: () => set({ isOpen: false }),
  setResults: (results) => set({ results, isLoading: false })
}))