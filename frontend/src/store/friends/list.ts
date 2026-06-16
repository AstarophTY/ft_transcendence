import type { StateCreator } from 'zustand'
import { toast } from 'sonner'
import {
  acceptFriendRequest,
  declineFriendRequest,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  removeFriend,
  sendFriendRequest,
} from '@/lib/api'
import { toMessage } from '@/lib/apiError'
import i18n from '@/i18n'
import {FriendsState, ListSlice} from "@/types/store/friends.ts";

export const createListSlice: StateCreator<FriendsState, [], [], ListSlice> = (
  set,
  get,
) => ({
  friends: [],
  incoming: [],
  outgoing: [],
  online: [],
  loading: false,

  panelOpen: false,
  setPanelOpen: (open) => set({ panelOpen: open }),
  togglePanel: () => set({ panelOpen: !get().panelOpen }),

  refresh: async () => {
    set({ loading: true })
    try {
      const [friends, incoming, outgoing] = await Promise.all([
        listFriends(),
        listIncomingRequests(),
        listOutgoingRequests(),
      ])
      set({ friends, incoming, outgoing, loading: false })
    } catch (error) {
      set({ loading: false })
      toast.error(toMessage(error))
    }
  },

  sendRequest: async (username) => {
    try {
      await sendFriendRequest(username.trim())
      toast.success(i18n.t('friends.requestSent'))
      await get().refresh()
      return true
    } catch (error) {
      toast.error(toMessage(error))
      return false
    }
  },

  accept: async (id) => {
    try {
      await acceptFriendRequest(id)
      toast.success(i18n.t('friends.requestAccepted'))
      await get().refresh()
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  decline: async (id) => {
    try {
      await declineFriendRequest(id)
      await get().refresh()
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  remove: async (friend) => {
    try {
      await removeFriend(friend.id)
      toast.success(i18n.t('friends.removed', { name: friend.username }))
      if (get().activeFriend?.id === friend.id) get().closeChat()
      await get().refresh()
    } catch (error) {
      toast.error(toMessage(error))
    }
  },
})
