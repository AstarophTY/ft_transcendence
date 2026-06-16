export interface AuthTokens {
    accessToken: string
    refreshToken: string
}

// --- friends ---------------------------------------------------------------

export type UserRole = 'USER' | 'ADMIN'

/** A user's campus, exposed as a relation (only the label is sent). */
export interface CampusRef {
    label: string
}

/** Public-facing profile of another user — never exposes the email. */
export interface PublicUser {
    id: string
    username: string
    avatar: string | null
    role: UserRole
    displayName: string | null
    bio: string | null
    status: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE'
    statusMessage: string | null
    campus: CampusRef | null
    coins: number
    logtimeHours: number
    monthLogtimeHours: number
    createdAt: string
}

export type FriendshipStatus = 'PENDING' | 'ACCEPTED'

export interface Friendship {
    id: string
    requesterId: string
    addresseeId: string
    status: FriendshipStatus
    createdAt: string
    updatedAt: string
    requester: PublicUser
    addressee: PublicUser
}

export interface DirectMessage {
    id: string
    content: string
    senderId: string
    receiverId: string
    isRead: boolean
    createdAt: string
}