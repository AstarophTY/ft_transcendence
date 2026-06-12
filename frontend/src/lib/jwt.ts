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

/**
 * True if a JWT is unreadable or its `exp` has passed (optionally treating it as
 * expired `skewMs` early, to refresh proactively before a request goes out).
 * Used to avoid firing doomed authenticated requests on a stale session, which
 * the browser would otherwise log as 401s.
 */
export function isTokenExpired(token: string, skewMs = 0): boolean {
  const payload = decodeAccessToken(token)
  if (!payload?.exp) return true
  return payload.exp * 1000 <= Date.now() + skewMs
}
