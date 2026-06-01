import type { StateCreator } from 'zustand'
import { toast } from 'sonner'
import { getConversation, sendMessage } from '@/lib/api'
import { toMessage } from '@/lib/apiError'
import type { ChatSlice, FriendsState } from './types'

export const createChatSlice: StateCreator<FriendsState, [], [], ChatSlice> = (
  set,
  get,
) => ({
  activeFriend: null,
  messages: [],
  messagesLoading: false,

  openChat: async (friend) => {
    set({ activeFriend: friend, messages: [], messagesLoading: true })
    try {
      const messages = await getConversation(friend.id)
      // Ignore if the user switched chats while loading.
      if (get().activeFriend?.id !== friend.id) return
      set({ messages, messagesLoading: false })
    } catch (error) {
      set({ messagesLoading: false })
      toast.error(toMessage(error))
    }
  },

  closeChat: () => set({ activeFriend: null, messages: [] }),

  send: async (content) => {
    const friend = get().activeFriend
    if (!friend) return false
    try {
      const message = await sendMessage(friend.id, content.trim())
      if (get().activeFriend?.id === friend.id) {
        set({ messages: [...get().messages, message] })
      }
      return true
    } catch (error) {
      toast.error(toMessage(error))
      return false
    }
  },
})
