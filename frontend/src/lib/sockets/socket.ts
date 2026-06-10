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

/** Connects (once) to the friends real-time channel using the access token. */
export function connectSocket(token: string): Socket {
  if (socket) return socket
  socket = io({
    path: '/ws/socket.io',
    auth: async (cb) => {
      const validToken = await getValidToken()
      cb({ token: validToken ?? token })
    },
    transports: ['websocket'],
  })
  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
