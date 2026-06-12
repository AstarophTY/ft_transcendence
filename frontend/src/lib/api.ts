import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { isTokenExpired } from '@/lib/jwt'

let sessionExpiredToastShown = false

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    // Requests we cancel on purpose when there is no session (see the request
    // interceptor) reject with a cancel — never an unhandled error.
    if (axios.isCancel(reason)) {
      event.preventDefault()
      return
    }
    if (reason && typeof reason === 'object' && 'response' in reason) {
      const response = (reason as Record<string, unknown>).response
      if (response && typeof response === 'object' && 'status' in response && response.status === 401) {
        event.preventDefault()
      }
    }
  })
}

const ACCESS_KEY = 'ft_access_token'
const REFRESH_KEY = 'ft_refresh_token'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem(ACCESS_KEY)
  },
  get refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY)
  },
  save(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({ baseURL })

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Auth endpoints (login/register/refresh/42) are reachable while logged out.
  if (config.url?.includes('/auth/')) return config

  if (refreshing) {
    await refreshing
  }
  let token = tokenStore.access
  // Refresh an access token that is expired (or about to be) before the request
  // leaves, so it never comes back 401 and triggers the retry dance.
  if (token && isTokenExpired(token, 10_000)) {
    if (!refreshing) {
      refreshing = refreshAccessToken().finally(() => {
        refreshing = null
      })
    }
    token = await refreshing
  }
  // No usable session: cancel quietly instead of firing a request the browser
  // would log as a 401. Callers/effects are gated on `user`, so this only
  // guards stray requests made while logged out.
  if (!token) {
    return Promise.reject(new axios.Cancel('auth:no-session'))
  }
  config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing: Promise<string | null> | null = null

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.refresh
  if (!refreshToken) return null
  // The refresh token is itself a JWT: if it has already expired there is no
  // point posting it (the server would 401 and the browser would log it) — the
  // session is simply over, so drop it locally.
  if (isTokenExpired(refreshToken)) {
    tokenStore.clear()
    return null
  }
  try {
    const { data } = await axios.post<AuthTokens>(`${baseURL}/auth/refresh`, {
      refreshToken,
    })
    tokenStore.save(data)
    return data.accessToken
  } catch {
    tokenStore.clear()
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined

    const isAuthRoute = original?.url?.includes('/auth/')
    if (error.response?.status !== 401 || !original || original._retry || isAuthRoute) {
      return Promise.reject(error)
    }

    original._retry = true
    if (!refreshing) {
      refreshing = refreshAccessToken().finally(() => {
        refreshing = null
      })
    }
    const newToken = await refreshing

    if (!newToken) {
      if (!sessionExpiredToastShown) {
        sessionExpiredToastShown = true
        toast.error(i18n.t('auth.sessionExpired', { defaultValue: 'Session expired, please log in again' }))
        setTimeout(() => {
          sessionExpiredToastShown = false
        }, 5000)
      }
      onUnauthorized?.()
      return Promise.reject(error)
    }

    original.headers = original.headers ?? {}
    original.headers.Authorization = `Bearer ${newToken}`
    return api(original)
  },
)

export async function registerRequest(body: {
  email: string
  username: string
  password: string
}): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/register', body)
  return data
}

export async function loginRequest(body: {
  email: string
  password: string
}): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/login', body)
  return data
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout')
}

export function getFortyTwoLoginUrl(): string {
  return `${baseURL}/auth/42`
}

// --- friends ---------------------------------------------------------------

export type UserRole = 'USER' | 'ADMIN'

/** A user's campus, exposed as a relation (only the label is sent). */
export interface CampusRef {
  label: string
}

/** Public-facing profile of another user — never exposes the email. */
export interface PublicUser {
  id: string
  username: string
  avatar: string | null
  role: UserRole
  displayName: string | null
  bio: string | null
  status: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE'
  statusMessage: string | null
  campus: CampusRef | null
  coins: number
  logtimeHours: number
  monthLogtimeHours: number
  createdAt: string
}

export type FriendshipStatus = 'PENDING' | 'ACCEPTED'

export interface Friendship {
  id: string
  requesterId: string
  addresseeId: string
  status: FriendshipStatus
  createdAt: string
  updatedAt: string
  requester: PublicUser
  addressee: PublicUser
}

export interface DirectMessage {
  id: string
  content: string
  senderId: string
  receiverId: string
  isRead: boolean
  createdAt: string
}

export async function listFriends(): Promise<PublicUser[]> {
  const { data } = await api.get<PublicUser[]>('/friends')
  return data
}

export async function getFriendProfile(friendId: string): Promise<PublicUser> {
  const { data } = await api.get<PublicUser>(`/friends/${friendId}`)
  return data
}

export async function removeFriend(friendId: string): Promise<void> {
  await api.delete(`/friends/${friendId}`)
}

export async function listIncomingRequests(): Promise<Friendship[]> {
  const { data } = await api.get<Friendship[]>('/friends/requests/incoming')
  return data
}

export async function listOutgoingRequests(): Promise<Friendship[]> {
  const { data } = await api.get<Friendship[]>('/friends/requests/outgoing')
  return data
}

export async function sendFriendRequest(username: string): Promise<Friendship> {
  const { data } = await api.post<Friendship>('/friends/requests', { username })
  return data
}

export async function acceptFriendRequest(id: string): Promise<Friendship> {
  const { data } = await api.post<Friendship>(`/friends/requests/${id}/accept`)
  return data
}

export async function declineFriendRequest(id: string): Promise<void> {
  await api.delete(`/friends/requests/${id}`)
}

export async function getConversation(
  friendId: string,
): Promise<DirectMessage[]> {
  const { data } = await api.get<DirectMessage[]>(
    `/friends/${friendId}/messages`,
  )
  return data
}

export async function sendMessage(
  friendId: string,
  content: string,
): Promise<DirectMessage> {
  const { data } = await api.post<DirectMessage>(
    `/friends/${friendId}/messages`,
    { content },
  )
  return data
}
