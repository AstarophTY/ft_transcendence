import {
    AdminStats,
    AdminUser,
    AdminUserUpdate,
    SignupPoint
} from "@/types/api/admin.ts";
import {CampusWithMembers} from "@/types/api/campus.ts";
import {UserRole} from "@/types/api/api.ts";

export interface AdminState {
    open: boolean
    stats: AdminStats | null
    signups: SignupPoint[]
    users: AdminUser[]
    campuses: CampusWithMembers[]
    loading: boolean
    editing: AdminUser | null

    setOpen: (open: boolean) => void
    setEditing: (user: AdminUser | null) => void
    load: () => Promise<void>
    changeRole: (id: string, role: UserRole) => Promise<void>
    removeUser: (user: AdminUser) => Promise<void>
    saveUser: (id: string, body: AdminUserUpdate) => Promise<boolean>
    resetPassword: (id: string, newPassword: string) => Promise<boolean>
    createCampus: (label: string) => Promise<boolean>
    saveCampus: (id: string, body: { label?: string; coins?: number; seed?: string; regenerate?: boolean }) => Promise<boolean>
    removeCampus: (campus: CampusWithMembers) => Promise<void>
    attachMember: (campusId: string, userId: string) => Promise<void>
    detachMember: (campusId: string, userId: string) => Promise<void>
}