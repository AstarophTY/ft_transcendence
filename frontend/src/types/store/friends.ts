import {DirectMessage, Friendship, PublicUser} from "@/types/api/api.ts";

export interface ListSlice {
    friends: PublicUser[]
    incoming: Friendship[]
    outgoing: Friendship[]
    /** Ids of friends currently connected. */
    online: string[]
    loading: boolean

    /** Whether the social panel is open (shared with the HUD trigger). */
    panelOpen: boolean
    setPanelOpen: (open: boolean) => void
    togglePanel: () => void

    refresh: () => Promise<void>
    sendRequest: (username: string) => Promise<boolean>
    accept: (id: string) => Promise<void>
    decline: (id: string) => Promise<void>
    remove: (friend: PublicUser) => Promise<void>
}

export interface ChatSlice {
    activeFriend: PublicUser | null
    messages: DirectMessage[]
    messagesLoading: boolean

    openChat: (friend: PublicUser) => Promise<void>
    closeChat: () => void
    send: (content: string) => Promise<boolean>
}

export interface SocketSlice {
    /** Open the real-time channel (presence, requests, messages). */
    connect: () => void
    disconnect: () => void
}

export type FriendsState = ListSlice & ChatSlice & SocketSlice
