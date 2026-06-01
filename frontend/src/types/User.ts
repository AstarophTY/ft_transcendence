import type { AuthUser } from '@/store/auth'

export type ConnectionStatus = 'online' | 'dnd' | 'offline';

export interface UserBadgeProps {
  user: AuthUser
  className?: string
}
