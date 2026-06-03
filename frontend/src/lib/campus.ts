import { api } from '@/lib/api'
import type { UserRole } from '@/lib/api'

export type CampusRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

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
}

export interface CampusRequest {
  id: string
  label: string
  status: CampusRequestStatus
  requestedById: string
  createdAt: string
  updatedAt: string
}

/** Approved campuses — any signed-in user can read these. */
export async function listCampuses(): Promise<Campus[]> {
  const { data } = await api.get<Campus[]>('/campus')
  return data
}

/** Pending campus requests awaiting staff review (ADMIN only). */
export async function listCampusRequests(): Promise<CampusRequest[]> {
  const { data } = await api.get<CampusRequest[]>('/campus/requests')
  return data
}

export async function approveCampusRequest(id: string): Promise<Campus> {
  const { data } = await api.post<Campus>(`/campus/requests/${id}/approve`)
  return data
}

export async function declineCampusRequest(id: string): Promise<void> {
  await api.post(`/campus/requests/${id}/decline`)
}

// --- campus management (ADMIN) ---------------------------------------------

/** Every campus with its members and coin balance. */
export async function listManagedCampuses(): Promise<CampusWithMembers[]> {
  const { data } = await api.get<CampusWithMembers[]>('/campus/manage')
  return data
}

export async function updateCampus(
  id: string,
  body: { label?: string; coins?: number },
): Promise<Campus> {
  const { data } = await api.patch<Campus>(`/campus/${id}`, body)
  return data
}

export async function deleteCampus(id: string): Promise<void> {
  await api.delete(`/campus/${id}`)
}

export async function removeCampusMember(
  campusId: string,
  userId: string,
): Promise<void> {
  await api.delete(`/campus/${campusId}/members/${userId}`)
}
