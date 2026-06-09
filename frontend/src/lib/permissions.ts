import { useAuth } from '@/store/auth'
import { usePlanetStore } from '@/store/planetStore'

/**
 * Whether the current user may build in the active world (freecam + block edits).
 *
 * Only 42 accounts can build: they always carry a `campusId` (synced from 42),
 * whereas guest/non-42 accounts have none. A 42 account may only edit its own
 * campus planet or its personal planet — never another campus's world.
 */
export function canEditCurrentWorld(): boolean {
  const campusId = useAuth.getState().user?.campusId ?? null
  if (!campusId) return false
  const { isPrivateWorld, activeCampusId } = usePlanetStore.getState()
  if (isPrivateWorld) return true
  return activeCampusId === campusId
}

/** Reactive variant of {@link canEditCurrentWorld} for use in React components. */
export function useCanEditCurrentWorld(): boolean {
  const campusId = useAuth((s) => s.user?.campusId ?? null)
  const isPrivateWorld = usePlanetStore((s) => s.isPrivateWorld)
  const activeCampusId = usePlanetStore((s) => s.activeCampusId)
  if (!campusId) return false
  if (isPrivateWorld) return true
  return activeCampusId === campusId
}
