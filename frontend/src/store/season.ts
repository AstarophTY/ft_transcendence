import { create } from 'zustand'
import { toast } from 'sonner'
import {
  castCampusVote,
  castVote,
  closeVoteNow,
  createSeason,
  deleteSeason,
  endBuildNow,
  finalizeSeason,
  getBallot,
  getCurrentSeason,
  listSeasons,
  openVoteNow,
  updateSeason,
} from '@/lib/api/season'
import { toMessage } from '@/lib/apiError'
import i18n from '@/i18n'
import {SeasonState} from "@/types/store/season.ts";
import {Season} from "@/types/api/season.ts";

// A single timer that re-fetches the season exactly when its next phase edge is
// crossed, so edit/cam gating flips live (e.g. UPCOMING → BUILD) without a page
// refresh. The refetch also activates a due queued season on the backend.
let phaseTimer: ReturnType<typeof setTimeout> | null = null

/** The soonest future phase boundary across the running + queued seasons. */
function nextPhaseBoundary(season: Season | null, next: Season | null, now: number): number | null {
  const edges: string[] = []
  if (season) edges.push(season.buildStartsAt, season.buildEndsAt, season.voteStartsAt, season.voteEndsAt)
  if (next) edges.push(next.buildStartsAt)
  const futures = edges.map((t) => new Date(t).getTime()).filter((t) => t > now)
  return futures.length ? Math.min(...futures) : null
}

function schedulePhaseRefresh(season: Season | null, next: Season | null, refresh: () => Promise<void>) {
  if (phaseTimer) clearTimeout(phaseTimer)
  phaseTimer = null
  const boundary = nextPhaseBoundary(season, next, Date.now())
  if (boundary === null) return
  // Fire just after the boundary; clamp so far-off seasons poll periodically and
  // setTimeout never overflows its 32-bit range.
  const delay = Math.min(Math.max(boundary - Date.now() + 500, 1000), 300_000)
  phaseTimer = setTimeout(() => void refresh(), delay)
}

export const useSeason = create<SeasonState>((set, get) => ({
  open: false,
  ballot: null,
  season: null,
  phase: null,
  next: null,
  seasons: [],
  loading: false,

  setOpen: (open) => {
    set({ open })
    if (open) void get().load()
  },

  load: async () => {
    set({ loading: true })
    try {
      const ballot = await getBallot()
      set({ ballot, season: ballot.season, phase: ballot.phase, next: ballot.next, loading: false })
      schedulePhaseRefresh(ballot.season, ballot.next, get().loadCurrent)
    } catch (error) {
      set({ loading: false })
      toast.error(toMessage(error))
    }
  },

  loadCurrent: async () => {
    try {
      const { season, phase, next } = await getCurrentSeason()
      set({ season, phase, next })
      schedulePhaseRefresh(season, next, get().loadCurrent)
    } catch {
      // Gating falls back to read-only on failure; no toast needed here.
    }
  },

  loadSeasons: async () => {
    try {
      const seasons = await listSeasons()
      set({ seasons })
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  vote: async (candidateId) => {
    try {
      await castVote(candidateId)
      await get().load()
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  voteCampus: async (campusId) => {
    try {
      await castCampusVote(campusId)
      await get().load()
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  saveSeason: async (body) => {
    try {
      await createSeason(body)
      toast.success(i18n.t('season.admin.created'))
      await Promise.all([get().load(), get().loadSeasons()])
      return true
    } catch (error) {
      toast.error(toMessage(error))
      return false
    }
  },

  editSeason: async (body) => {
    try {
      await updateSeason(body)
      toast.success(i18n.t('settings.saved'))
      await Promise.all([get().load(), get().loadSeasons()])
      return true
    } catch (error) {
      toast.error(toMessage(error))
      return false
    }
  },

  removeSeason: async (id) => {
    try {
      await deleteSeason(id)
      toast.success(i18n.t('season.admin.deleted'))
      await Promise.all([get().load(), get().loadSeasons()])
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  endBuild: async () => {
    try {
      await endBuildNow()
      await Promise.all([get().load(), get().loadSeasons()])
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  openVote: async () => {
    try {
      await openVoteNow()
      await Promise.all([get().load(), get().loadSeasons()])
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  closeVote: async () => {
    try {
      await closeVoteNow()
      await Promise.all([get().load(), get().loadSeasons()])
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  finalize: async () => {
    try {
      await finalizeSeason()
      toast.success(i18n.t('season.admin.finalized'))
      await Promise.all([get().load(), get().loadSeasons()])
    } catch (error) {
      toast.error(toMessage(error))
    }
  },
}))
