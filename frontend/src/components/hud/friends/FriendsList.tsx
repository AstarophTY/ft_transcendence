import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { MessageSquare, UserMinus, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { useFriends } from '@/store/friends'
import type { PublicUser } from '@/lib/api'
import Avatar from './Avatar'
import FriendProfile from './FriendProfile'

export default function FriendsList() {
  const { t } = useTranslation()
  const { friends, online, loading, openChat, remove } = useFriends()
  const [profile, setProfile] = useState<PublicUser | null>(null)

  if (loading && friends.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        {t('friends.empty')}
      </p>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-1 p-2">
        {friends.map((friend) => (
          <motion.li
            key={friend.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="group flex items-center gap-3 rounded-xl p-2 hover:bg-accent"
          >
            <Avatar
              src={friend.avatar}
              name={friend.username}
              online={online.includes(friend.id)}
            />
            <span className="flex-1 truncate font-medium">
              {friend.username}
            </span>

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                title={t('friends.actions.profile')}
                onClick={() => setProfile(friend)}
              >
                <Info className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t('friends.actions.message')}
                onClick={() => void openChat(friend)}
              >
                <MessageSquare className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t('friends.actions.remove')}
                className="text-destructive hover:text-destructive"
                onClick={() => void remove(friend)}
              >
                <UserMinus className="size-4" />
              </Button>
            </div>
          </motion.li>
        ))}
      </ul>

      <FriendProfile
        friend={profile}
        onOpenChange={(open) => !open && setProfile(null)}
      />
    </>
  )
}
