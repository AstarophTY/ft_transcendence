import { useAuth } from '@/store/auth'
import { usePlanetStore } from '@/store/planetStore'
import { useSeason } from '@/store/season'
import { derivePhase } from '@/lib/api/season'

/**
 * Whether the current user may build in the active world (freecam + block edits).
 *
 * Building is only open during a season's BUILD phase: outside it — and when no
 * season is running at all — worlds are visit-only. Only 42 accounts can build:
 * they always carry a `campusId` (synced from 42), whereas guest/non-42 accounts
 * have none. A 42 account may only edit its own campus planet or its personal
 * planet — never another campus's world.
 */
export function canEditCurrentWorld(): boolean {
  if (derivePhase(useSeason.getState().season) !== 'BUILD') return false
  const user = useAuth.getState().user
  const campusId = user?.campusId ?? null
  if (!campusId) return false
  const { isPrivateWorld, activeCampusId, visitUserId } = usePlanetStore.getState()
  if (isPrivateWorld) {
    // A visited island (someone else's) is read-only; your own is editable.
    return !visitUserId || visitUserId === user?.userId
  }
  return activeCampusId === campusId
}

/** Reactive variant of {@link canEditCurrentWorld} for use in React components. */
export function useCanEditCurrentWorld(): boolean {
  const user = useAuth((s) => s.user)
  const campusId = user?.campusId ?? null
  const season = useSeason((s) => s.season)
  const isPrivateWorld = usePlanetStore((s) => s.isPrivateWorld)
  const activeCampusId = usePlanetStore((s) => s.activeCampusId)
  const visitUserId = usePlanetStore((s) => s.visitUserId)
  if (derivePhase(season) !== 'BUILD') return false
  if (!campusId) return false
  if (isPrivateWorld) return !visitUserId || visitUserId === user?.userId
  return activeCampusId === campusId
}
