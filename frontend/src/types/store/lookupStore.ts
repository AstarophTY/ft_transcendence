export interface LookupRecord {
    date: string
    userName: string | null,
    userAvatar: string,
    userId: string,
    placedBlock: number
    previousBlock: number
}

export interface LookupState {
    isOpen: boolean
    isLoading: boolean
    results: LookupRecord[] | null
    openLookup: (loading?: boolean) => void
    closeLookup: () => void
    setResults: (results: LookupRecord[]) => void
}