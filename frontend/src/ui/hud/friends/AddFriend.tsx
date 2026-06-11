import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus } from 'lucide-react'
import { Button } from '@/ui/shadcn/button.tsx'
import { Input } from '@/ui/shadcn/input.tsx'
import { useFriends } from '@/store/friends'
import { validateUsername } from '@/lib/utils.ts'

export default function AddFriend() {
  const { t } = useTranslation()
  const sendRequest = useFriends((s) => s.sendRequest)
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const trimmed = username.trim()
  const isValid = validateUsername(trimmed)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)
    const ok = await sendRequest(trimmed)
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
        maxLength={20}
        aria-invalid={username.length > 0 && !isValid ? true : undefined}
      />
      <Button type="submit" disabled={!isValid || submitting}>
        <UserPlus className="size-4" />
        {t('friends.add.submit')}
      </Button>
    </form>
  )
}
