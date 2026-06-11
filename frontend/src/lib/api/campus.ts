import { api } from '@/lib/api'
import type { UserRole } from '@/lib/api'

export interface Campus {
  id: string
  label: string
  coins: number
}

export interface CampusMember {
  id: string
  username: string
  avatar: string | null
  role: UserRole
  coins: number
}

export interface CampusWithMembers extends Campus {
  /** Members' earned coins + the admin bonus (`coins`). */
  totalCoins: number
  users: CampusMember[]
  world?: {
    seed: string
  }
}

/** Approved campuses — any signed-in user can read these. */
export async function listCampuses(): Promise<Campus[]> {
  const { data } = await api.get<Campus[]>('/campus')
  return data
}

// --- campus management (ADMIN) ---------------------------------------------

/** Every campus with its members and coin balance. */
export async function listManagedCampuses(): Promise<CampusWithMembers[]> {
  const { data } = await api.get<CampusWithMembers[]>('/campus/manage')
  return data
}

export async function createCampus(label: string): Promise<Campus> {
  const { data } = await api.post<Campus>('/campus', { label })
  return data
}

export async function updateCampus(
  id: string,
  body: { label?: string; coins?: number; seed?: string; regenerate?: boolean },
): Promise<Campus> {
  const { data } = await api.patch<Campus>(`/campus/${id}`, body)
  return data
}

export async function deleteCampus(id: string): Promise<void> {
  await api.delete(`/campus/${id}`)
}

export async function addCampusMember(
  campusId: string,
  userId: string,
): Promise<void> {
  await api.post(`/campus/${campusId}/members/${userId}`)
}

export async function removeCampusMember(
  campusId: string,
  userId: string,
): Promise<void> {
  await api.delete(`/campus/${campusId}/members/${userId}`)
}
