import { api } from '@/lib/api'
import {
  Ballot, Season,
  SeasonCurrent,
  SeasonInput,
  SeasonListEntry, SeasonPhase
} from "@/types/api/season.ts";

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
