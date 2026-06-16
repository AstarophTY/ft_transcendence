import { io, type Socket } from 'socket.io-client'
import { socketOptions } from '@/lib/sockets/shared'

let socket: Socket | null = null

/**
 * Connects (once) to the `/world` real-time channel used to sync block edits
 * between the players standing on the same campus island.
 */
export function connectWorldSocket(token: string): Socket {
  if (socket) return socket
  socket = io('/world', socketOptions(token))
  return socket
}

export function getWorldSocket(): Socket | null {
  return socket
}

export function disconnectWorldSocket(): void {
  socket?.disconnect()
  socket = null
}
