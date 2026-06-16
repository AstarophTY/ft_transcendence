import { create } from "zustand";
import { LookupState } from "@/types/store/lookupStore.ts";

export const useLookupStore = create<LookupState>((set) => ({
  isOpen: false,
  isLoading: false,
  results: null,
  openLookup: (loading = true) => set({ isOpen: true, isLoading: loading, results: null }),
  closeLookup: () => set({ isOpen: false }),
  setResults: (results) => set({ results, isLoading: false })
}))