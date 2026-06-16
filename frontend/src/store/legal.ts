import { create } from 'zustand'
import {LegalState} from "@/types/store/legal.ts";

export const useLegal = create<LegalState>((set) => ({
  open: false,
  tab: 'privacy',
  openLegal: (tab) => set({ open: true, tab }),
  setOpen: (open) => set({ open }),
}))
