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

export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as AccessTokenPayload
  } catch {
    return null
  }
}
