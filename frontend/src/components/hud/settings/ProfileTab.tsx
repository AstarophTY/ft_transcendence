import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shadcn/button'
import { Input } from '@/components/shadcn/input'
import { useSettings } from '@/store/settings'
import type { UserStatus } from '@/lib/account'
import Field from './Field'

const STATUSES: UserStatus[] = ['ONLINE', 'AWAY', 'DND', 'OFFLINE']

export default function ProfileTab() {
  const { t } = useTranslation()
  const { me, saving, saveProfile } = useSettings()
  const [displayName, setDisplayName] = useState(me?.displayName ?? '')
  const [bio, setBio] = useState(me?.bio ?? '')
  const [status, setStatus] = useState<UserStatus>(me?.status ?? 'ONLINE')
  const [statusMessage, setStatusMessage] = useState(me?.statusMessage ?? '')

  const save = () =>
    void saveProfile({ displayName, bio, status, statusMessage })

  return (
    <div className="flex flex-col gap-4">
      <Field label={t('settings.profile.displayName')}>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />
      </Field>
      <Field label={t('settings.profile.bio')}>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={280}
          rows={3}
          className="rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </Field>
      <Field label={t('settings.profile.status')}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as UserStatus)}
          className="h-9 rounded-md border bg-transparent px-3 text-sm outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`settings.status.${s}`)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('settings.profile.statusMessage')}>
        <Input value={statusMessage} onChange={(e) => setStatusMessage(e.target.value)} maxLength={80} />
      </Field>
      <Button onClick={save} disabled={saving} className="self-start">
        {t('settings.save')}
      </Button>
    </div>
  )
}
