import {CampusWorld} from "@/types/api/world.ts";

export interface PlanetStore {
    /** One world per campus, loaded from the backend. */
    worlds: CampusWorld[]
    setWorlds: (worlds: CampusWorld[]) => void
    /** Refetch worlds (new seeds after a season reset), keeping the current selection. */
    reloadWorlds: () => Promise<void>
    /** Bumped on a world reset to force the active world to reload its blocks. */
    worldEpoch: number
    /** Fly into a campus world (used by the season podium "visit" action). */
    visitCampus: (campusId: string) => void
    planetCount: number
    setPlanetCount: (count: number) => void
    targetOffset: number
    setTargetOffset: (offset: number) => void
    activeIndex: number
    setActiveIndex: (index: number) => void
    /** Campus id of the currently selected world, or null while none is loaded. */
    activeCampusId: string | null
    setCampusId: (id: string | null) => void
    isPrivateWorld: boolean
    setIsPrivateWorld: (isPrivate: boolean) => void
    /** When set, the world scene shows this user's personal island (read-only if not self). */
    visitUserId: string | null
    setVisitUserId: (id: string | null) => void
    /** Jump straight into a user's personal island to look around it. */
    visitIsland: (userId: string) => void
    privatePlanetPos: [number, number, number] | null
    setPrivatePlanetPos: (pos: [number, number, number] | null) => void
    sceneMode: 'selection' | 'zooming' | 'zooming-private' | 'world'
    setSceneMode: (mode: 'selection' | 'zooming' | 'zooming-private' | 'world') => void
    /** True while the takeoff transition (world -> selection) is in progress. */
    isTakingOff: boolean
    setTakingOff: (value: boolean) => void
    renderDistance: number
    setRenderDistance: (dist: number) => void
    theme: 'light' | 'dark'
    setTheme: (theme: 'light' | 'dark') => void
    showTutorial: boolean
    setShowTutorial: (show: boolean) => void
}