interface PlayerAppearanceState {
    /** Local player's avatar tint, shared by the 3D model and the world sync. */
    skinColor: string
    loaded: boolean
    setSkinColor: (color: string) => void
    /** Fetch the saved skin once (no-op afterwards). */
    ensureLoaded: () => Promise<void>
}