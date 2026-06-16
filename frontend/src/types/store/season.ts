import {
    Ballot,
    Season, SeasonInput,
    SeasonListEntry,
    SeasonPhase
} from "@/types/api/season.ts";

export interface SeasonState {
    /** The profile-side vote dialog. */
    open: boolean
    ballot: Ballot | null
    season: Season | null
    phase: SeasonPhase | null
    /** A season scheduled to start later, queued behind the running one. */
    next: Season | null
    /** Every season (admin overview), newest first. */
    seasons: SeasonListEntry[]
    loading: boolean

    setOpen: (open: boolean) => void
    load: () => Promise<void>
    /** Lightweight fetch of just the running season (for world-edit gating). */
    loadCurrent: () => Promise<void>
    /** Admin: fetch the full list of seasons. */
    loadSeasons: () => Promise<void>
    vote: (candidateId: string) => Promise<void>
    /** Campus-level vote (campus-less accounts). */
    voteCampus: (campusId: string) => Promise<void>

    // admin actions
    saveSeason: (body: SeasonInput) => Promise<boolean>
    editSeason: (body: Partial<SeasonInput>) => Promise<boolean>
    removeSeason: (id: string) => Promise<void>
    endBuild: () => Promise<void>
    openVote: () => Promise<void>
    closeVote: () => Promise<void>
    finalize: () => Promise<void>
}