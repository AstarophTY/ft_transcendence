import { create } from 'zustand'
import { getSocket } from '@/lib/sockets/socket'
import {ChatMessage} from "@/types/social.ts";
import {MAX_MESSAGES} from "@/config/chatChannels.ts";
import {ChatChannelsState} from "@/types/store/chatChannels.ts";

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
