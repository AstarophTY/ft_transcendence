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
} from '@/lib/api/admin'
import {
  addCampusMember,
  createCampus,
  deleteCampus,
  listManagedCampuses,
  removeCampusMember,
  updateCampus,
} from '@/lib/api/campus'
import { toMessage } from '@/lib/apiError'
import i18n from '@/i18n'
import {AdminState} from "@/types/store/admin.ts";

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
      toast.success(i18n.t('admin.userDeleted', { name: user.username }))
      await get().load()
    } catch (error) {
      toast.error(toMessage(error))
    }
  },

  saveUser: async (id, body) => {
    try {
      const updated = await updateAdminUser(id, body)
      set({ editing: updated })
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

  createCampus: async (label) => {
    try {
      const campus = await createCampus(label)
      toast.success(i18n.t('admin.campus.created', { label: campus.label }))
      await get().load()
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

  attachMember: async (campusId, userId) => {
    try {
      await addCampusMember(campusId, userId)
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
