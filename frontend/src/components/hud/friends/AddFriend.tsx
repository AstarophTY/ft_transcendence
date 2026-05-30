import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { Input } from '@/components/shadcn/input'
import { useFriends } from '@/store/friends'

export default function AddFriend() {
  const { t } = useTranslation()
  const sendRequest = useFriends((s) => s.sendRequest)
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || submitting) return
    setSubmitting(true)
    const ok = await sendRequest(username)
    setSubmitting(false)
    if (ok) setUsername('')
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4">
      <label className="text-sm text-muted-foreground">
        {t('friends.add.label')}
      </label>
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder={t('friends.add.placeholder')}
        autoComplete="off"
      />
      <Button type="submit" disabled={!username.trim() || submitting}>
        <UserPlus className="size-4" />
        {t('friends.add.submit')}
      </Button>
    </form>
  )
}
