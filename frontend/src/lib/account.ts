import { api } from '@/lib/api'
import type { CampusRef, UserRole } from '@/lib/api'

export type UserStatus = 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE'

/** Full self profile (email + campus included, no password hash). */
export interface SelfUser {
  id: string
  email: string | null
  username: string
  avatar: string | null
  role: UserRole
  displayName: string | null
  bio: string | null
  campus: CampusRef | null
  coins: number
  logtimeHours: number
  monthLogtimeHours: number
  coinsPerHour: number
  language: string | null
  theme: string | null
  skinColor: string | null
  status: UserStatus
  statusMessage: string | null
  usernameChangedAt: string | null
  fortyTwoLogin: string | null
  createdAt: string
  /** Hours elapsed since the account was registered. */
  siteLogtimeHours: number
}

/** Freely-editable fields — extend alongside the backend DTO. */
export interface ProfileUpdate {
  displayName?: string
  bio?: string
  email?: string
  language?: string
  theme?: string
  skinColor?: string
  status?: UserStatus
  statusMessage?: string
}

export async function getMe(): Promise<SelfUser> {
  const { data } = await api.get<SelfUser>('/users/me')
  return data
}

export async function uploadAvatar(file: File): Promise<SelfUser> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<SelfUser>('/users/me/avatar', form)
  return data
}

export async function updateProfile(body: ProfileUpdate): Promise<SelfUser> {
  const { data } = await api.patch<SelfUser>('/users/me', body)
  return data
}

export async function changeUsername(username: string): Promise<SelfUser> {
  const { data } = await api.patch<SelfUser>('/users/me/username', { username })
  return data
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.patch('/users/me/password', { currentPassword, newPassword })
}
