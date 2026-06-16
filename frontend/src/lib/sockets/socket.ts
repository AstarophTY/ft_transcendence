import { io, type Socket } from 'socket.io-client'
import { socketOptions } from '@/lib/sockets/shared'

let socket: Socket | null = null

/** Connects (once) to the friends real-time channel using the access token. */
export function connectSocket(token: string): Socket {
  if (socket) return socket
  socket = io(socketOptions(token))
  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
