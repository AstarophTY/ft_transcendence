import { api } from '@/lib/api'
import {ProfileUpdate, SelfUser} from "@/types/api/account.ts";

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

/** Permanently delete the signed-in user's account (cascades all data). */
export async function deleteAccount(): Promise<void> {
  await api.delete('/users/me')
}
