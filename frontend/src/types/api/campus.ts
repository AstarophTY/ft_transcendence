import {UserRole} from "@/types/api/api.ts";

export interface Campus {
    id: string
    label: string
    coins: number
}

export interface CampusMember {
    id: string
    username: string
    avatar: string | null
    role: UserRole
    coins: number
}

export interface CampusWithMembers extends Campus {
    /** Members' earned coins + the admin bonus (`coins`). */
    totalCoins: number
    users: CampusMember[]
    world?: {
        seed: string
    }
}