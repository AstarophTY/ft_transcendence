import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/ui/shadcn/button.tsx'
import { Input } from '@/ui/shadcn/input.tsx'
import { useSettings } from '@/store/settings.ts'
import Field from './Field.tsx'

const COOLDOWN_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export default function AccountTab() {
  const { t } = useTranslation()
  const { me, saving, renameUser, saveProfile } = useSettings()
  const [username, setUsername] = useState(me?.username ?? '')
  const [email, setEmail] = useState(me?.email ?? '')

  const daysLeft = (() => {
    if (!me?.usernameChangedAt) return 0
    const elapsed = Date.now() - new Date(me.usernameChangedAt).getTime()
    return Math.max(0, Math.ceil((COOLDOWN_DAYS * DAY_MS - elapsed) / DAY_MS))
  })()

  return (
    <div className="flex flex-col gap-4">
      <Field
        label={t('settings.account.username')}
        hint={
          daysLeft > 0
            ? t('settings.account.cooldown', { days: daysLeft })
            : t('settings.account.usernameHint')
        }
      >
        <div className="flex gap-2">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} disabled={daysLeft > 0} />
          <Button
            onClick={() => void renameUser(username)}
            disabled={saving || daysLeft > 0 || username === me?.username}
          >
            {t('settings.save')}
          </Button>
        </div>
      </Field>

      {me?.fortyTwoLogin ? (
        <Field label={t('settings.account.email')} hint={t('settings.account.email42Hint')}>
          <Input type="email" value={me?.email ?? '—'} disabled />
        </Field>
      ) : (
        <Field label={t('settings.account.email')}>
          <div className="flex gap-2">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button onClick={() => void saveProfile({ email })} disabled={saving || email === (me?.email ?? '')}>
              {t('settings.save')}
            </Button>
          </div>
        </Field>
      )}

      <Field label={t('settings.account.campus')} hint={t('settings.account.campusHint')}>
        <Input value={me?.campus?.label ?? '—'} disabled />
      </Field>

      {me?.fortyTwoLogin && (
        <>
          <Field label={t('settings.account.fortyTwo')}>
            <Input value={me.fortyTwoLogin} disabled />
          </Field>

          <Field
            label={t('settings.account.siteLogtime', { defaultValue: 'Logtime' })}
            hint={t('settings.account.siteLogtimeHint', {
              defaultValue: 'Total 42 logtime since account creation',
            })}
          >
            <Input
              value={`${Math.floor(me.logtimeHours ?? 0)} h`}
              disabled
            />
          </Field>
        </>
      )}
    </div>
  )
}
