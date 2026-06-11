import { create } from 'zustand'

export interface LookupRecord {
  date: string
  userName: string | null,
  userAvatar: string,
  userId: string,
  placedBlock: number
  previousBlock: number
}

interface LookupState {
  isOpen: boolean
  isLoading: boolean
  results: LookupRecord[] | null
  openLookup: (loading?: boolean) => void
  closeLookup: () => void
  setResults: (results: LookupRecord[]) => void
}

export const useLookupStore = create<LookupState>((set) => ({
  isOpen: false,
  isLoading: false,
  results: null,
  openLookup: (loading = true) => set({ isOpen: true, isLoading: loading, results: null }),
  closeLookup: () => set({ isOpen: false }),
  setResults: (results) => set({ results, isLoading: false })
}))