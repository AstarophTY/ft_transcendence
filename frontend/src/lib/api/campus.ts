import { api } from '@/lib/api'
import {Campus, CampusWithMembers} from "@/types/api/campus.ts";

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
