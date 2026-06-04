import type { StateCreator } from 'zustand'
import { toast } from 'sonner'
import { tokenStore, type DirectMessage, type Friendship } from '@/lib/api'
import { connectSocket, disconnectSocket } from '@/lib/sockets/socket'
import { useAuth } from '@/store/auth'
import { useChatChannels } from '@/store/chatChannels'
import i18n from '@/i18n'
import type { FriendsState, SocketSlice } from './types'

export const createSocketSlice: StateCreator<
  FriendsState,
  [],
  [],
  SocketSlice
> = (set, get) => ({
  connect: () => {
    const token = tokenStore.access
    if (!token) return
    const socket = connectSocket(token)
    const nameOf = (id: string) =>
      get().friends.find((f) => f.id === id)?.username ?? ''
    const setOnline = (ids: string[]) => set({ online: ids })

    useChatChannels.getState().setupListeners()

    socket
      .off('presence:init')
      .on('presence:init', ({ online }: { online: string[] }) =>
        setOnline(online),
      )
      .off('friend:online')
      .on('friend:online', ({ userId }: { userId: string }) => {
        setOnline(Array.from(new Set([...get().online, userId])))
        const name = nameOf(userId)
        if (name) toast.success(i18n.t('friends.notif.online', { name }))
      })
      .off('friend:offline')
      .on('friend:offline', ({ userId }: { userId: string }) =>
        setOnline(get().online.filter((id) => id !== userId)),
      )
      .off('friend:request')
      .on('friend:request', ({ friendship }: { friendship: Friendship }) => {
        void get().refresh()
        toast.info(
          i18n.t('friends.notif.request', {
            name: friendship.requester.username,
          }),
        )
      })
      .off('friend:accepted')
      .on('friend:accepted', ({ friendship }: { friendship: Friendship }) => {
        void get().refresh()
        const myId = useAuth.getState().user?.userId
        const other =
          friendship.requester.id === myId
            ? friendship.addressee
            : friendship.requester
        toast.success(i18n.t('friends.notif.accepted', { name: other.username }))
      })
      .off('friend:removed')
      .on('friend:removed', () => void get().refresh())
      .off('message:new')
      .on('message:new', ({ message }: { message: DirectMessage }) => {
        const active = get().activeFriend
        if (active && message.senderId === active.id) {
          set({ messages: [...get().messages, message] })
          return
        }
        const name = nameOf(message.senderId)
        if (name) toast.info(i18n.t('friends.notif.message', { name }))
      })
  },

  disconnect: () => {
    disconnectSocket()
    set({ online: [] })
  },
})
