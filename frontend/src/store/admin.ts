import { create } from 'zustand'
import { toast } from 'sonner'
import {
  deleteUser,
  getAdminStats,
  listAdminUsers,
  setUserRole,
  type AdminStats,
  type AdminUser,
} from '@/lib/admin'
import type { UserRole } from '@/lib/api'
import { toMessage } from '@/lib/apiError'

interface AdminState {
  open: boolean
  stats: AdminStats | null
  users: AdminUser[]
  loading: boolean

  setOpen: (open: boolean) => void
  load: () => Promise<void>
  changeRole: (id: string, role: UserRole) => Promise<void>
  removeUser: (user: AdminUser) => Promise<void>
}

export const useAdmin = create<AdminState>((set, get) => ({
  open: false,
  stats: null,
  users: [],
  loading: false,

  setOpen: (open) => {
    set({ open })
    if (open) void get().load()
  },

  load: async () => {
    set({ loading: true })
    try {
      const [stats, users] = await Promise.all([
        getAdminStats(),
        listAdminUsers(),
      ])
      set({ stats, users, loading: false })
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
}))
