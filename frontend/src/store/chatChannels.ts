import { create } from 'zustand'
import { getSocket } from '@/lib/socket'

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
}

const MAX_MESSAGES = 200

interface ChatChannelsState {
  serverMessages: ChatMessage[]

  /** Call once when the friends socket connects. */
  setupListeners: () => void

  sendServer: (content: string) => void
}

export const useChatChannels = create<ChatChannelsState>((set) => ({
  serverMessages: [],

  setupListeners() {
    getSocket()
      ?.off('server:chat:message')
      .on('server:chat:message', (msg: ChatMessage) => {
        set((s) => ({
          serverMessages: [...s.serverMessages.slice(-(MAX_MESSAGES - 1)), msg],
        }))
      })
  },

  sendServer(content) {
    getSocket()?.emit('server:chat', { content })
  },
}))
