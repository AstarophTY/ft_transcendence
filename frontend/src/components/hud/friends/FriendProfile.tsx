import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, CalendarDays } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog'
import { getFriendProfile, type PublicUser } from '@/lib/api'
import { toMessage } from '@/lib/apiError'
import Avatar from './Avatar'

interface FriendProfileProps {
  friend: PublicUser | null
  onOpenChange: (open: boolean) => void
}

/**
 * Shows the public profile of a friend (avatar, username, role, join date).
 * Fetched through `GET /friends/:id`, which never returns the email.
 */
export default function FriendProfile({
  friend,
  onOpenChange,
}: FriendProfileProps) {
  const { t, i18n } = useTranslation()
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!friend) return
    let active = true
    setProfile(null)
    setError(null)
    getFriendProfile(friend.id)
      .then((data) => active && setProfile(data))
      .catch((err) => active && setError(toMessage(err)))
    return () => {
      active = false
    }
  }, [friend])

  const joined = profile
    ? new Date(profile.createdAt).toLocaleDateString(i18n.language)
    : ''

  return (
    <Dialog open={friend !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('friends.profile.title')}</DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {profile && (
          <div className="flex flex-col items-center gap-4">
            <Avatar src={profile.avatar} name={profile.username} size={88} />
            <p className="text-xl font-semibold">{profile.username}</p>

            <div className="w-full space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4" />
                {t(`role.${profile.role}`)}
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                {t('friends.profile.joined', { date: joined })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
