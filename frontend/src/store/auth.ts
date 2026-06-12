import { create } from 'zustand'
import { toast } from 'sonner'
import {
  getFortyTwoLoginUrl,
  loginRequest,
  logoutRequest,
  refreshAccessToken,
  registerRequest,
  setUnauthorizedHandler,
  tokenStore,
  type AuthTokens,
} from '@/lib/api'
import { decodeAccessToken, isTokenExpired } from '@/lib/jwt'
import { deleteAccount, getMe } from '@/lib/api/account'
import { toMessage } from '@/lib/apiError'
import i18n from '@/i18n'

export interface AuthUser {
  userId: string
  email: string | null
  username: string
  avatar: string | null
  role: 'USER' | 'ADMIN'
  campusId: string | null
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  /** True when a brand-new 42 account must accept the Privacy Policy. */
  requirePrivacy: boolean
  init: () => void
  login: (email: string, password: string) => Promise<boolean>
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<boolean>
  logout: () => Promise<void>
  loginWith42: () => void
  acceptPrivacy: () => void
  declinePrivacy: () => Promise<void>
  /** Permanently delete the signed-in account, then drop the local session. */
  deleteMyAccount: () => Promise<boolean>
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
    campusId: payload.campusId,
  }
}

/** Refresh the in-memory user with the current DB values (avatar, username...). */
async function hydrateUser(): Promise<void> {
  try {
    const me = await getMe()
    useAuth.setState((s) => {
      if (!s.user) return s
      // The JWT is the source of truth for authorization. If the role in the
      // DB disagrees with the JWT, force the user to re-authenticate so they
      // get a token that carries the correct role.
      if (me.role !== s.user.role) {
        tokenStore.clear()
        toast.error(i18n.t('auth.roleChanged', { defaultValue: 'Your role has been updated — please log in again' }))
        return { user: null }
      }
      return {
        user: {
          ...s.user,
          email: me.email,
          username: me.username,
          avatar: me.avatar,
          role: me.role,
        },
      }
    })
  } catch {
    // Keep the token-derived user if the profile fetch fails.
  }
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  requirePrivacy: false,

  init: async () => {
    const params = new URLSearchParams(window.location.search)
    const access = params.get('access_token')
    const refresh = params.get('refresh_token')
    const isNew = params.get('is_new') === '1'
    if (access && refresh) {
      const tokens: AuthTokens = { accessToken: access, refreshToken: refresh }
      tokenStore.save(tokens)
      window.history.replaceState({}, '', window.location.pathname)
      // A freshly created 42 account must accept the Privacy Policy before
      // it can use the app; gate it here right after the OAuth round-trip.
      if (isNew) set({ requirePrivacy: true })
      toast.success(i18n.t('auth.loginSuccess'))
      set({ loading: false })
    }

    // A failed 42 round-trip redirects back here with a stable error code
    // (user declined on the consent page, or the code expired/was reused).
    const authError = params.get('auth_error')
    if (authError) {
      window.history.replaceState({}, '', window.location.pathname)
      toast.error(
        authError === 'denied'
          ? i18n.t('auth.fortyTwoDenied')
          : i18n.t('auth.fortyTwoFailed'),
      )
    }

    setUnauthorizedHandler(() => {
      set({ user: null })
      toast.error(i18n.t('auth.sessionExpired'))
    })

    // Resolve the session before exposing a user: an expired access token is
    // silently refreshed, and a dead session is cleared. This is what keeps a
    // stale session from setting `user` and tripping every gated loader (and
    // the sockets) into firing requests that come back 401.
    let stored = tokenStore.access
    if (stored && isTokenExpired(stored)) {
      stored = await refreshAccessToken()
    }
    if (stored) {
      set({ user: userFromToken(stored) })
      // The JWT carries a snapshot of mutable fields (avatar, username...) from
      // when it was issued. Re-hydrate from the DB so a change made after login
      // (e.g. a new profile picture) survives a page refresh.
      void hydrateUser()
    } else {
      tokenStore.clear()
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
    set({ user: null, requirePrivacy: false })
    toast.success(i18n.t('auth.logoutSuccess'))
  },

  loginWith42: () => {
    set({ loading: true })
    window.location.href = getFortyTwoLoginUrl()
  },

  acceptPrivacy: () => set({ requirePrivacy: false }),

  declinePrivacy: async () => {
    // Declining cancels the just-created 42 sign-up: permanently delete the
    // account (cascades all data) while the access token is still valid, then
    // drop the local session.
    set({ requirePrivacy: false })
    try {
      await deleteAccount()
    } catch {
      // Network/already-gone: fall through and clear the session anyway.
    }
    tokenStore.clear()
    set({ user: null })
    toast.success(i18n.t('auth.signupCancelled'))
  },

  deleteMyAccount: async () => {
    try {
      await deleteAccount()
    } catch (error) {
      toast.error(toMessage(error))
      return false
    }
    tokenStore.clear()
    set({ user: null, requirePrivacy: false })
    toast.success(i18n.t('auth.accountDeleted'))
    return true
  },
}))
