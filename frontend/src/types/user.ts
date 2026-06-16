import {AuthUser} from "@/types/store/auth.ts";

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