import {CampusRef, UserRole} from "@/types/api/api.ts";

export type UserStatus = 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE'

/** Full self profile (email + campus included, no password hash). */
export interface SelfUser {
    id: string
    email: string | null
    username: string
    avatar: string | null
    role: UserRole
    displayName: string | null
    bio: string | null
    campus: CampusRef | null
    coins: number
    logtimeHours: number
    monthLogtimeHours: number
    coinsPerHour: number
    language: string | null
    theme: string | null
    skinColor: string | null
    status: UserStatus
    statusMessage: string | null
    usernameChangedAt: string | null
    fortyTwoLogin: string | null
    createdAt: string
    /** Hours elapsed since the account was registered. */
    siteLogtimeHours: number
}

/** Freely-editable fields — extend alongside the backend DTO. */
export interface ProfileUpdate {
    displayName?: string
    bio?: string
    email?: string
    language?: string
    theme?: string
    skinColor?: string
    status?: UserStatus
    statusMessage?: string
}