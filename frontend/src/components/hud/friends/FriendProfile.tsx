import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, CalendarDays, MapPin, Coins, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog'
import { Badge } from '@/components/shadcn/badge'
import { Separator } from '@/components/shadcn/separator'
import { getFriendProfile, type PublicUser } from '@/lib/api'
import { toMessage } from '@/lib/apiError'
import Avatar from './Avatar'

interface FriendProfileProps {
  friend: PublicUser | null
  onOpenChange: (open: boolean) => void
}

const STATUS_COLOR: Record<string, string> = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-yellow-400',
  DND: 'bg-red-500',
  OFFLINE: 'bg-muted-foreground',
}

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  ONLINE: 'success',
  AWAY: 'warning',
  DND: 'destructive',
  OFFLINE: 'secondary',
}

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
    ? new Date(profile.createdAt).toLocaleDateString(i18n.language, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const displayName = profile?.displayName ?? profile?.username ?? ''
  const statusKey = profile?.status ?? 'OFFLINE'

  return (
    <Dialog open={friend !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('friends.profile.title')}</DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {profile && (
          <div className="flex flex-col gap-4">
            {/* Header: avatar + name + status */}
            <div className="flex flex-col items-center gap-3 pt-1">
              <div className="relative">
                <Avatar src={profile.avatar} name={profile.username} size={80} />
                <span
                  className={`absolute bottom-1 right-1 size-3.5 rounded-full border-2 border-background ${STATUS_COLOR[statusKey]}`}
                />
              </div>

              <div className="text-center">
                <p className="text-xl font-bold leading-tight">{displayName}</p>
                {profile.displayName && (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                )}

                <div className="mt-2 flex items-center justify-center gap-2">
                  <Badge variant={STATUS_BADGE[statusKey]}>
                    {t(`settings.status.${statusKey}`)}
                  </Badge>
                  <Badge variant={profile.role === 'ADMIN' ? 'warning' : 'secondary'}>
                    {t(`role.${profile.role}`)}
                  </Badge>
                </div>

                {profile.statusMessage && (
                  <p className="mt-2 text-xs italic text-muted-foreground">
                    "{profile.statusMessage}"
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Bio */}
            <div className="text-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('friends.profile.bio')}
              </p>
              {profile.bio ? (
                <p className="whitespace-pre-wrap">{profile.bio}</p>
              ) : (
                <p className="italic text-muted-foreground">{t('friends.profile.noBio')}</p>
              )}
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-2 text-sm text-muted-foreground">
              {profile.campus && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" />
                  <span>{profile.campus.label}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0" />
                <span>{t(`role.${profile.role}`)}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 shrink-0" />
                <span>{t('friends.profile.joined', { date: joined })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="size-4 shrink-0 text-yellow-500" />
                <span>{t('profile.coins', { count: profile.coins })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 shrink-0" />
                <span>
                  {t('profile.monthLogtime', {
                    hours: Math.round(profile.monthLogtimeHours),
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
