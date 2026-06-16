import { api } from '@/lib/api'
import {CampusWorld, WorldBlock, WorldDetail} from "@/types/api/world.ts";

/** One world per campus — drives the planet selection menu. */
export async function listWorlds(): Promise<CampusWorld[]> {
  const { data } = await api.get<CampusWorld[]>('/world')
  return data
}

/** A campus world: its generation profile plus every persisted block edit. */
export async function getWorld(campusId: string | null): Promise<WorldDetail> {
  const { data } = await api.get<WorldDetail>(`/world/${campusId}`)
  return data
}

/** Persist a batch of block edits (placed or broken) on a campus world. */
export async function saveWorldBlocks(
  campusId: string,
  blocks: WorldBlock[],
): Promise<void> {
  if (blocks.length === 0) return
  await api.post(`/world/${campusId}/blocks`, { blocks })
}
