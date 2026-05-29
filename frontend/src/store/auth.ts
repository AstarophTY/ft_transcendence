import { create } from 'zustand'
import { AxiosError } from 'axios'
import { toast } from 'sonner'
import {
  getFortyTwoLoginUrl,
  loginRequest,
  logoutRequest,
  registerRequest,
  setUnauthorizedHandler,
  tokenStore,
  type AuthTokens,
} from '@/lib/api'
import { decodeAccessToken } from '@/lib/jwt'
import i18n from '@/i18n'

export interface AuthUser {
  userId: string
  email: string | null
  username: string
  avatar: string | null
  role: 'USER' | 'ADMIN'
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  init: () => void
  login: (email: string, password: string) => Promise<boolean>
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<boolean>
  logout: () => Promise<void>
  loginWith42: () => void
}

function userFromToken(accessToken: string): AuthUser | null {
  const payload = decodeAccessToken(accessToken)
  if (!payload) return null
  return {
    userId: payload.sub,
    email: payload.email,
    username: payload.username,
    avatar: payload.avatar,
    role: payload.role,
  }
}

function toMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined
    const message = data?.message
    if (Array.isArray(message)) return message[0]
    if (message) return message
  }
  return i18n.t('auth.errorFallback')
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,

  init: () => {
    const params = new URLSearchParams(window.location.search)
    const access = params.get('access_token')
    const refresh = params.get('refresh_token')
    if (access && refresh) {
      const tokens: AuthTokens = { accessToken: access, refreshToken: refresh }
      tokenStore.save(tokens)
      window.history.replaceState({}, '', window.location.pathname)
      toast.success(i18n.t('auth.loginSuccess'))
    }

    setUnauthorizedHandler(() => {
      set({ user: null })
      toast.error(i18n.t('auth.sessionExpired'))
    })

    const stored = tokenStore.access
    if (stored) {
      set({ user: userFromToken(stored) })
    }
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const tokens = await loginRequest({ email, password })
      tokenStore.save(tokens)
      set({ user: userFromToken(tokens.accessToken), loading: false })
      toast.success(i18n.t('auth.loginSuccess'))
      return true
    } catch (error) {
      set({ loading: false })
      toast.error(toMessage(error))
      return false
    }
  },

  register: async (email, username, password) => {
    set({ loading: true })
    try {
      const tokens = await registerRequest({ email, username, password })
      tokenStore.save(tokens)
      set({ user: userFromToken(tokens.accessToken), loading: false })
      toast.success(i18n.t('auth.registerSuccess'))
      return true
    } catch (error) {
      set({ loading: false })
      toast.error(toMessage(error))
      return false
    }
  },

  logout: async () => {
    try {
      await logoutRequest()
    } catch {
      // ignore network errors on logout, clear locally anyway
    }
    tokenStore.clear()
    set({ user: null })
    toast.success(i18n.t('auth.logoutSuccess'))
  },

  loginWith42: () => {
    window.location.href = getFortyTwoLoginUrl()
  },
}))
