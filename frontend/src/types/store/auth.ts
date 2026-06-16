export interface AuthUser {
    userId: string
    email: string | null
    username: string
    avatar: string | null
    role: 'USER' | 'ADMIN'
    campusId: string | null
}

export interface AuthState {
    user: AuthUser | null
    loading: boolean
    /** True when a brand-new 42 account must accept the Privacy Policy. */
    requirePrivacy: boolean
    init: () => void
    login: (email: string, password: string) => Promise<boolean>
    register: (
        email: string,
        username: string,
        password: string,
    ) => Promise<boolean>
    logout: () => Promise<void>
    loginWith42: () => void
    acceptPrivacy: () => void
    declinePrivacy: () => Promise<void>
    /** Permanently delete the signed-in account, then drop the local session. */
    deleteMyAccount: () => Promise<boolean>
}