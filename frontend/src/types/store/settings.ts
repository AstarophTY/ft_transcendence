import {ProfileUpdate, SelfUser} from "@/types/api/account.ts";

export interface SettingsState {
    open: boolean
    me: SelfUser | null
    loading: boolean
    saving: boolean

    setOpen: (open: boolean) => void
    load: () => Promise<void>
    saveProfile: (body: ProfileUpdate) => Promise<boolean>
    renameUser: (username: string) => Promise<boolean>
    updatePassword: (current: string, next: string) => Promise<boolean>
    changeAvatar: (file: File) => Promise<boolean>
}