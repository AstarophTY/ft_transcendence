import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Coins } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { Input } from '@/components/shadcn/input'
import { useSettings } from '@/store/settings'
import Field from './Field'

/** Progress bar toward the next coin, based on the current logtime hour. */
function CoinsProgress({
  coins,
  logtimeHours,
  monthLogtimeHours,
  coinsPerHour,
}: {
  coins: number
  logtimeHours: number
  monthLogtimeHours: number
  coinsPerHour: number
}) {
  const { t } = useTranslation()
  const rate = coinsPerHour || 1
  // Fraction of the current coin already earned (0..1).
  const intoNext = Math.min(1, Math.max(0, logtimeHours * rate - coins))
  const minutesLeft = Math.ceil((1 - intoNext) * (60 / rate))
  const percent = Math.round(intoNext * 100)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium tabular-nums">
          <Coins className="size-4 text-yellow-500" />
          {coins}
        </span>
        <span className="text-xs text-muted-foreground">
          {t('profile.nextCoin', { minutes: minutesLeft })}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-yellow-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {t('profile.monthLogtime', { hours: Math.round(monthLogtimeHours) })}
      </span>
    </div>
  )
}

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

      <Field label={t('profile.coinsLabel')}>
        {me?.fortyTwoLogin ? (
          <CoinsProgress
            coins={me.coins}
            logtimeHours={me.logtimeHours}
            monthLogtimeHours={me.monthLogtimeHours}
            coinsPerHour={me.coinsPerHour}
          />
        ) : (
          <Input value={String(me?.coins ?? 0)} disabled />
        )}
      </Field>

      <Field
        label={t('settings.account.siteLogtime', { defaultValue: 'Logtime' })}
        hint={t('settings.account.siteLogtimeHint', {
          defaultValue: 'Time since you joined the site',
        })}
      >
        <Input
          value={`${Math.floor(me?.siteLogtimeHours ?? 0)} h`}
          disabled
        />
      </Field>

      {me?.fortyTwoLogin && (
        <Field label={t('settings.account.fortyTwo')}>
          <Input value={me.fortyTwoLogin} disabled />
        </Field>
      )}
    </div>
  )
}
