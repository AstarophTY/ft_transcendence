export interface WorldEconomyState {
    /** Build budget of the current campus. null = not yet received from server. */
    coins: number | null
    setCoins: (coins: number) => void
    /** Reset to unknown state when joining a new campus. */
    reset: () => void
    /** Optimistic local adjustment; the server's `world:coins` later corrects it. */
    adjust: (delta: number) => void
}