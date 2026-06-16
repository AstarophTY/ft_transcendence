import { api } from '@/lib/api'
import {
  AdminStats,
  AdminUser,
  AdminUserUpdate,
  SignupPoint
} from "@/types/api/admin.ts";
import {UserRole} from "@/types/api/api.ts";

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>('/admin/stats')
  return data
}

export async function getSignups(): Promise<SignupPoint[]> {
  const { data } = await api.get<SignupPoint[]>('/admin/signups')
  return data
}

export async function updateAdminUser(
  id: string,
  body: AdminUserUpdate,
): Promise<AdminUser> {
  const { data } = await api.patch<AdminUser>(`/admin/users/${id}`, body)
  return data
}

export async function resetUserPassword(
  id: string,
  newPassword: string,
): Promise<void> {
  await api.patch(`/admin/users/${id}/password`, { newPassword })
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const { data } = await api.get<AdminUser[]>('/admin/users')
  return data
}

export async function setUserRole(
  id: string,
  role: UserRole,
): Promise<AdminUser> {
  const { data } = await api.patch<AdminUser>(`/admin/users/${id}/role`, { role })
  return data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/admin/users/${id}`)
}
