import { create } from 'zustand'

export type LegalTab = 'privacy' | 'terms'

interface LegalState {
  open: boolean
  tab: LegalTab
  /** Open the legal dialog on a specific document. */
  openLegal: (tab: LegalTab) => void
  setOpen: (open: boolean) => void
}

export const useLegal = create<LegalState>((set) => ({
  open: false,
  tab: 'privacy',
  openLegal: (tab) => set({ open: true, tab }),
  setOpen: (open) => set({ open }),
}))
