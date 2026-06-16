import type { StateCreator } from 'zustand'
import { toast } from 'sonner'
import { connectSocket, disconnectSocket } from '@/lib/sockets/socket'
import { disconnectWorldSocket } from '@/lib/sockets/worldSocket'
import { listWorlds } from '@/lib/api/world'
import { useAuth } from '@/store/auth'
import { useAdmin } from '@/store/admin'
import { useChatChannels } from '@/store/chatChannels'
import { usePlanetStore } from '@/store/planetStore'
import i18n from '@/i18n'
import {tokenStore} from "@/lib/api.ts";
import {DirectMessage, Friendship} from "@/types/api/api.ts";
import {FriendsState, SocketSlice} from "@/types/store/friends.ts";

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
        if (!friendship?.requester) return
        toast.info(
          i18n.t('friends.notif.request', {
            name: friendship.requester.username,
          }),
        )
      })
      .off('friend:accepted')
      .on('friend:accepted', ({ friendship }: { friendship: Friendship }) => {
        void get().refresh()
        if (!friendship?.requester || !friendship?.addressee) return
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
      .off('user:avatar')
      .on('user:avatar', ({ userId, avatar }: { userId: string; avatar: string | null }) => {
        // A user swapped their picture: patch every place we already hold their
        // data so the new avatar shows up live, no reload needed.
        set({
          friends: get().friends.map((f) =>
            f.id === userId ? { ...f, avatar } : f,
          ),
          activeFriend:
            get().activeFriend?.id === userId
              ? { ...get().activeFriend!, avatar }
              : get().activeFriend,
        })
        useAdmin.setState((s) => ({
          users: s.users.map((u) => (u.id === userId ? { ...u, avatar } : u)),
          editing:
            s.editing?.id === userId ? { ...s.editing, avatar } : s.editing,
        }))
        // Keep our own identity in sync too (e.g. avatar changed from another tab).
        useAuth.setState((s) =>
          s.user?.userId === userId ? { user: { ...s.user, avatar } } : s,
        )
      })
      .off('campus:assigned')
      .on(
        'campus:assigned',
        ({ campusId, label }: { campusId: string; label: string }) => {
          // An admin added us to a campus: update our identity so we can build
          // straight away, no reload needed.
          useAuth.setState((s) =>
            s.user ? { user: { ...s.user, campusId } } : s,
          )
          // Pull in the campus planet so it shows up in the selector, but don't
          // yank the carousel while the player is inside a world.
          if (usePlanetStore.getState().sceneMode === 'selection') {
            void listWorlds().then((worlds) =>
              usePlanetStore.getState().setWorlds(worlds),
            )
          }
          toast.success(i18n.t('campus.joined', { label }))
        },
      )
      .off('campus:removed')
      .on('campus:removed', () => {
        useAuth.setState((s) =>
          s.user ? { user: { ...s.user, campusId: null } } : s,
        )
        toast.info(i18n.t('campus.left'))
      })
      .off('auth:kick')
      .on('auth:kick', ({ reason }: { reason?: string }) => {
        tokenStore.clear()
        useAuth.setState({ user: null })
        disconnectSocket()
        disconnectWorldSocket()
        const msg = reason === 'role_changed'
          ? i18n.t('auth.roleChanged', { defaultValue: 'Your role has been updated — please log in again' })
          : i18n.t('auth.concurrentLogin', { defaultValue: 'Disconnected: another connection was opened under this account' })
        toast.error(msg)
      })
  },

  disconnect: () => {
    disconnectSocket()
    set({ online: [] })
  },
})
