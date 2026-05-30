import { api } from '@/lib/api'
import type { UserRole } from '@/lib/api'
import type { UserStatus } from '@/lib/account'

export interface AdminStats {
  total: number
  admins: number
  users: number
  fortyTwo: number
  local: number
  newLast7Days: number
}

export interface AdminUser {
  id: string
  username: string
  email: string | null
  avatar: string | null
  role: UserRole
  campus: string | null
  status: UserStatus
  fortyTwoLogin: string | null
  isVerified: boolean
  createdAt: string
}

export interface SignupPoint {
  date: string
  count: number
}

/** Fields an admin may edit on any account. */
export interface AdminUserUpdate {
  email?: string
  displayName?: string
  bio?: string
  campus?: string
  status?: UserStatus
  statusMessage?: string
}

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
