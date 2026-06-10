import { api } from '@/lib/api'
import type { Block } from '@/types/Block'

/** Terrain generation profile of a campus world (mirrors the backend). */
export interface WorldProfile {
  seed: string
  widthInChunks: number
  depthInChunks: number
  scale: number
  octaves: number
  persistence: number
  relief: number
  baseHeight: number
  variationRange: number
}

/** A campus world in the selection menu: its campus plus its terrain profile. */
export interface CampusWorld extends WorldProfile {
  campusId: string
  label: string
  blocks?: WorldBlock[]
}

/** A single persisted block edit (block = 0/Air for a broken block). */
export interface WorldBlock {
  x: number
  y: number
  z: number
  block: Block
  /** Encoded orientation (2 bits per X/Y/Z axis, 0..63); 0 = unrotated. */
  rotation: number
}

/** A campus world with its profile and every persisted block edit. */
export interface WorldDetail extends WorldProfile {
  campusId: string
  blocks: WorldBlock[]
  contests?: unknown[]
}

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
