import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/ui/shadcn/button.tsx'
import { Input } from '@/ui/shadcn/input.tsx'
import { Textarea } from '@/ui/shadcn/textarea.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select.tsx'
import { useSettings } from '@/store/settings.ts'
import Field from '@/ui/hud/settings/Field.tsx'
import AvatarPicker from '@/ui/hud/settings/AvatarPicker.tsx'
import {UserStatus} from "@/types/api/account.ts";

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
      <AvatarPicker />

      <Field label={t('settings.profile.displayName')}>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
        />
      </Field>

      <Field label={t('settings.profile.bio')}>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={280}
          rows={3}
        />
      </Field>

      <Field label={t('settings.profile.status')}>
        <Select value={status} onValueChange={(v) => setStatus(v as UserStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`settings.status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label={t('settings.profile.statusMessage')}>
        <Input
          value={statusMessage}
          onChange={(e) => setStatusMessage(e.target.value)}
          maxLength={80}
        />
      </Field>

      <Button onClick={save} disabled={saving} className="self-start">
        {t('settings.save')}
      </Button>
    </div>
  )
}
