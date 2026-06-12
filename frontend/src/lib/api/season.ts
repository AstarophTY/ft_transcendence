import { api } from '@/lib/api'

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

/**
 * Derive the live phase of a season from its timestamps — the client mirror of
 * the backend's `SeasonService.phaseOf`. Returns null when there is no season,
 * which gates building off (worlds are visit-only until a season runs).
 */
export function derivePhase(
  season: Pick<Season, 'buildStartsAt' | 'buildEndsAt' | 'voteStartsAt' | 'voteEndsAt'> | null,
  now: number = Date.now(),
): SeasonPhase | null {
  if (!season) return null
  if (now < new Date(season.buildStartsAt).getTime()) return 'UPCOMING'
  if (now < new Date(season.buildEndsAt).getTime()) return 'BUILD'
  if (now < new Date(season.voteStartsAt).getTime()) return 'DELAY'
  if (now < new Date(season.voteEndsAt).getTime()) return 'VOTE'
  return 'ENDED'
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

export async function getCurrentSeason(): Promise<SeasonCurrent> {
  const { data } = await api.get<SeasonCurrent>('/season/current')
  return data
}

/** Admin: every season (past, running and queued), newest first. */
export async function listSeasons(): Promise<SeasonListEntry[]> {
  const { data } = await api.get<SeasonListEntry[]>('/season/all')
  return data
}

export async function getBallot(): Promise<Ballot> {
  const { data } = await api.get<Ballot>('/season/ballot')
  return data
}

export async function castVote(candidateId: string): Promise<void> {
  await api.post('/season/vote', { candidateId })
}

export async function castCampusVote(campusId: string): Promise<void> {
  await api.post('/season/vote-campus', { campusId })
}

// --- admin -----------------------------------------------------------------

export async function createSeason(body: SeasonInput): Promise<Season> {
  const { data } = await api.post<Season>('/season', body)
  return data
}

export async function updateSeason(body: Partial<SeasonInput>): Promise<Season> {
  const { data } = await api.patch<Season>('/season', body)
  return data
}

export async function endBuildNow(): Promise<Season> {
  const { data } = await api.post<Season>('/season/end-build')
  return data
}

export async function openVoteNow(): Promise<Season> {
  const { data } = await api.post<Season>('/season/open-vote')
  return data
}

export async function closeVoteNow(): Promise<Season> {
  const { data } = await api.post<Season>('/season/close-vote')
  return data
}

export async function finalizeSeason(): Promise<Season> {
  const { data } = await api.post<Season>('/season/finalize')
  return data
}

export async function deleteSeason(id: string): Promise<void> {
  await api.delete(`/season/${id}`)
}
