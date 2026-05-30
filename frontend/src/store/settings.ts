import { create } from 'zustand'
import { toast } from 'sonner'
import {
  changePassword,
  changeUsername,
  getMe,
  updateProfile,
  type ProfileUpdate,
  type SelfUser,
} from '@/lib/account'
import { toMessage } from '@/lib/apiError'
import i18n from '@/i18n'

interface SettingsState {
  open: boolean
  me: SelfUser | null
  loading: boolean
  saving: boolean

  setOpen: (open: boolean) => void
  load: () => Promise<void>
  saveProfile: (body: ProfileUpdate) => Promise<boolean>
  renameUser: (username: string) => Promise<boolean>
  updatePassword: (current: string, next: string) => Promise<boolean>
}

export const useSettings = create<SettingsState>((set, get) => ({
  open: false,
  me: null,
  loading: false,
  saving: false,

  setOpen: (open) => {
    set({ open })
    if (open && !get().me) void get().load()
  },

  load: async () => {
    set({ loading: true })
    try {
      set({ me: await getMe(), loading: false })
    } catch (error) {
      set({ loading: false })
      toast.error(toMessage(error))
    }
  },

  saveProfile: async (body) => {
    set({ saving: true })
    try {
      set({ me: await updateProfile(body), saving: false })
      toast.success(i18n.t('settings.saved'))
      return true
    } catch (error) {
      set({ saving: false })
      toast.error(toMessage(error))
      return false
    }
  },

  renameUser: async (username) => {
    set({ saving: true })
    try {
      set({ me: await changeUsername(username), saving: false })
      toast.success(i18n.t('settings.saved'))
      return true
    } catch (error) {
      set({ saving: false })
      toast.error(toMessage(error))
      return false
    }
  },

  updatePassword: async (current, next) => {
    set({ saving: true })
    try {
      await changePassword(current, next)
      set({ saving: false })
      toast.success(i18n.t('settings.passwordChanged'))
      return true
    } catch (error) {
      set({ saving: false })
      toast.error(toMessage(error))
      return false
    }
  },
}))
