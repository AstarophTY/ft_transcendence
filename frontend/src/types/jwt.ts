export interface AccessTokenPayload {
    sub: string
    email: string | null
    username: string
    avatar: string | null
    role: 'USER' | 'ADMIN'
    campusId: string | null
    jti: string
    iat: number
    exp: number
}