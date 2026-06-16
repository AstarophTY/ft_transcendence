export type LegalTab = 'privacy' | 'terms'

export interface LegalState {
    open: boolean
    tab: LegalTab
    /** Open the legal dialog on a specific document. */
    openLegal: (tab: LegalTab) => void
    setOpen: (open: boolean) => void
}