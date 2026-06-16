export type SeasonPhase = 'UPCOMING' | 'BUILD' | 'DELAY' | 'VOTE' | 'ENDED'

export interface Season {
    id: string
    title: string
    buildStartsAt: string
    buildEndsAt: string
    voteStartsAt: string
    voteEndsAt: string
    finalizedAt: string | null
    /** When the season was activated (its world reset ran); null while queued. */
    startedAt: string | null
    isActive: boolean
    createdAt: string
}

/** A season plus its derived phase, as returned by the admin list. */
export interface SeasonListEntry {
    season: Season
    phase: SeasonPhase
}

export interface SeasonCurrent {
    season: Season | null
    phase: SeasonPhase | null
    /** A season scheduled to start later, queued behind the running one. */
    next: Season | null
}

export interface BallotCandidate {
    userId: string
    username: string
    avatar: string | null
    votes: number
}

export interface BallotCampus {
    campusId: string
    label: string
    isOwn: boolean
    /** Campus-level votes received (from campus-less accounts) — drives the podium. */
    campusVotes: number
    candidates: BallotCandidate[]
}

/** A campus's winning island from the most recent finalized season. */
export interface PreviousWinner {
    campusId: string
    campusLabel: string
    username: string | null
    avatar: string | null
    votes: number
}

export interface Ballot {
    season: Season | null
    phase: SeasonPhase | null
    /** A season scheduled to start later, queued behind the running one. */
    next: Season | null
    myVoteCandidateId: string | null
    /** The campus this (campus-less) user voted for, if any. */
    myCampusVoteId: string | null
    /** Members vote for an island in their own campus. */
    canVote: boolean
    /** Campus-less accounts vote for a whole campus instead. */
    canVoteCampus: boolean
    campuses: BallotCampus[]
    /** Title of the last finalized season (for the winners tab). */
    previousSeasonTitle: string | null
    /** Winning island per campus from the last finalized season. */
    previousWinners: PreviousWinner[]
}

export interface SeasonInput {
    title: string
    buildStartsAt: string
    buildEndsAt: string
    voteDelayMinutes: number
    voteDurationMinutes: number
    /** Confirm an immediate takeover that ends the running season + resets worlds. */
    force?: boolean
}