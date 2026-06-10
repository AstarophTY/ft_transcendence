import { io, type Socket } from 'socket.io-client'
import { tokenStore, refreshAccessToken } from '@/lib/api'
import { decodeAccessToken } from '@/lib/jwt'

let socket: Socket | null = null

async function getValidToken(): Promise<string | null> {
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
 * Connects (once) to the `/world` real-time channel used to sync block edits
 * between the players standing on the same campus island.
 */
export function connectWorldSocket(token: string): Socket {
  if (socket) return socket
  socket = io('/world', {
    path: '/ws/socket.io',
    auth: async (cb) => {
      const validToken = await getValidToken()
      cb({ token: validToken ?? token })
    },
    transports: ['websocket'],
  })
  return socket
}

export function getWorldSocket(): Socket | null {
  return socket
}

export function disconnectWorldSocket(): void {
  socket?.disconnect()
  socket = null
}
