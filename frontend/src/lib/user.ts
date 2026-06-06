import { tokenStore } from '@/lib/api'
import { jwtDecode } from 'jwt-decode'

export const getUserId = () => {
  const token = tokenStore.access;
  if (!token) return null;
  
  try {
    const decoded = jwtDecode<{ sub: string }>(token)
    return decoded.sub;
  } catch (e) {
    return null;
  }
}
