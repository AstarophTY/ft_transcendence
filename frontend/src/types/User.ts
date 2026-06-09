import type { AuthUser } from '@/store/auth'

export type ConnectionStatus = 'online' | 'dnd' | 'offline';

export interface UserBadgeProps {
  user: AuthUser
  className?: string
  onlyAvatar?: boolean
}


export interface AvatarProps {
  src?: string | null
  name: string
  size?: number
  className?: string
  online?: boolean
  status?: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE'
}