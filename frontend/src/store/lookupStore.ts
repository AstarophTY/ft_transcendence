import { create } from 'zustand'

export interface LookupRecord {
  date: string
  userId: string
}

interface LookupState {
  isOpen: boolean
  isLoading: boolean
  results: LookupRecord[] | null
  openLookup: () => void
  closeLookup: () => void
  setResults: (results: LookupRecord[]) => void
}

export const useLookupStore = create<LookupState>((set) => ({
  isOpen: false,
  isLoading: false,
  results: null,
  openLookup: () => set({ isOpen: true, isLoading: true, results: null }),
  closeLookup: () => set({ isOpen: false }),
  setResults: (results) => set({ results, isLoading: false })
}))