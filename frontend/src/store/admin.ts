import { create } from 'zustand'
import { toast } from 'sonner'
import {
  deleteUser,
  getAdminStats,
  getSignups,
  listAdminUsers,
  resetUserPassword,
  setUserRole,
  updateAdminUser,
  type AdminStats,
  type AdminUser,
  type AdminUserUpdate,
  type SignupPoint,
} from '@/lib/admin'
import {
  deleteCampus,
  listManagedCampuses,
  removeCampusMember,
  updateCampus,
  type CampusWithMembers,
} from '@/lib/campus'
import type { UserRole } from '@/lib/api'
import { toMessage } from '@/lib/apiError'
import i18n from '@/i18n'

interface AdminState {
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
  saveCampus: (id: string, body: { label?: string; coins?: number }) => Promise<boolean>
  removeCampus: (campus: CampusWithMembers) => Promise<void>
  detachMember: (campusId: string, userId: string) => Promise<void>
}

export const useAdmin = create<AdminState>((set, get) => ({
  open: false,
  stats: null,
  signups: [],
  users: [],
  campuses: [],
  loading: false,
  editing: null,

  setOpen: (open) => {
    set({ open })
    if (open) void get().load()
  },

  setEditing: (user) => set({ editing: user }),

  load: async () => {
    set({ loading: true })
    try {
      const [stats, signups, users, campuses] =
        await Promise.all([
          getAdminStats(),
          getSignups(),
          listAdminUsers(),
          listManagedCampuses(),
        ])
      set({ stats, signups, users, campuses, loading: false })
    } catch (error) {
      set({ loading: false })
      toast.error(toMessage(error))
    }
  },

  changeRole: async (id, role) => {
    try {
      await setUserRole(id, role)
      await get().load()
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  removeUser: async (user) => {
    try {
      await deleteUser(user.id)
      toast.success(`${user.username} deleted`)
      await get().load()
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  saveUser: async (id, body) => {
    try {
      await updateAdminUser(id, body)
      toast.success(i18n.t('settings.saved'))
      await get().load()
      return true
    } catch (error) {
      toast.error(toMessage(error))
      return false
    }
  },

  resetPassword: async (id, newPassword) => {
    try {
      await resetUserPassword(id, newPassword)
      toast.success(i18n.t('settings.passwordChanged'))
      return true
    } catch (error) {
      toast.error(toMessage(error))
      return false
    }
  },

  saveCampus: async (id, body) => {
    try {
      await updateCampus(id, body)
      toast.success(i18n.t('settings.saved'))
      await get().load()
      return true
    } catch (error) {
      toast.error(toMessage(error))
      return false
    }
  },

  removeCampus: async (campus) => {
    try {
      await deleteCampus(campus.id)
      toast.success(i18n.t('admin.campus.deleted', { label: campus.label }))
      await get().load()
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  detachMember: async (campusId, userId) => {
    try {
      await removeCampusMember(campusId, userId)
      await get().load()
    } catch (error) {
      toast.error(toMessage(error))
    }
  },
}))
