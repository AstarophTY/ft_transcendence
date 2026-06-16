import {UserStatus} from "@/types/api/account.ts";
import {CampusRef, UserRole} from "@/types/api/api.ts";

export interface AdminStats {
    total: number
    admins: number
    users: number
    fortyTwo: number
    local: number
    newLast7Days: number
}

export interface AdminUser {
    id: string
    username: string
    email: string | null
    avatar: string | null
    role: UserRole
    displayName: string | null
    bio: string | null
    campus: CampusRef | null
    coins: number
    logtimeHours: number
    monthLogtimeHours: number
    status: UserStatus
    statusMessage: string | null
    fortyTwoLogin: string | null
    isVerified: boolean
    createdAt: string
}

export interface SignupPoint {
    date: string
    count: number
}

/** Fields an admin may edit on any account. */
export interface AdminUserUpdate {
    email?: string
    displayName?: string
    bio?: string
    campus?: string
    status?: UserStatus
    statusMessage?: string
}