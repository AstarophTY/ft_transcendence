import type { ManagerOptions, SocketOptions } from 'socket.io-client'
import { tokenStore, refreshAccessToken } from '@/lib/api'
import { decodeAccessToken } from '@/lib/jwt'

/**
 * Returns a still-valid access token, refreshing it first when it is within 10s
 * of expiring. Used by the socket `auth` callback so reconnections always send a
 * fresh token rather than a stale one.
 */
export async function getValidToken(): Promise<string | null> {
  let token = tokenStore.access
  if (!token) return null

  const decoded = decodeAccessToken(token)
  if (decoded && decoded.exp * 1000 < Date.now() + 10000) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      token = newToken
    }
  }
  return token
}

/**
 * Shared socket.io options. The reconnection backoff is deliberately spread out
 * (2s → up to 15s) so a brief server restart triggers only a handful of retries
 * instead of a burst of failed-connection attempts: the browser logs a
 * `WebSocket connection … failed` line for every attempt while the server is
 * down (that native log can't be suppressed from JS), so fewer attempts means a
 * far quieter console. The socket still recovers automatically once the server
 * is back.
 */
export function socketOptions(token: string): Partial<ManagerOptions & SocketOptions> {
  return {
    path: '/ws/socket.io',
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 15000,
    randomizationFactor: 0.5,
    timeout: 10000,
    auth: async (cb) => {
      const validToken = await getValidToken()
      cb({ token: validToken ?? token })
    },
  }
}
