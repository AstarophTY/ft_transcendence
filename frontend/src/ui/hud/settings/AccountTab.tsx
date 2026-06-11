import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/ui/shadcn/button.tsx'
import { Input } from '@/ui/shadcn/input.tsx'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog.tsx'
import { useSettings } from '@/store/settings.ts'
import { useAuth } from '@/store/auth.ts'
import Field from './Field.tsx'
import { validateUsername, validateEmail } from '@/lib/utils.ts'

const COOLDOWN_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export default function AccountTab() {
  const { t } = useTranslation()
  const { me, saving, renameUser, saveProfile } = useSettings()
  const deleteMyAccount = useAuth((s) => s.deleteMyAccount)
  const [username, setUsername] = useState(me?.username ?? '')
  const [email, setEmail] = useState(me?.email ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const onDelete = async () => {
    setDeleting(true)
    const ok = await deleteMyAccount()
    setDeleting(false)
    if (ok) setConfirmOpen(false)
  }

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
            : !validateUsername(username) && username !== me?.username && username.length > 0
              ? t('auth.usernameInvalid', { defaultValue: 'Username may only contain letters, numbers, _ and - (3-20 chars)' })
              : t('settings.account.usernameHint')
        }
      >
        <div className="flex gap-2">
          <Input 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            disabled={daysLeft > 0} 
            aria-invalid={!validateUsername(username) && username !== me?.username && username.length > 0 ? true : undefined}
          />
          <Button
            onClick={() => void renameUser(username)}
            disabled={saving || daysLeft > 0 || username === me?.username || !validateUsername(username)}
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
        <Field 
          label={t('settings.account.email')}
          hint={!validateEmail(email) && email !== (me?.email ?? '') && email.length > 0 ? t('settings.account.emailInvalid', { defaultValue: 'Please enter a valid email address.' }) : undefined}
        >
          <div className="flex gap-2">
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              aria-invalid={!validateEmail(email) && email !== (me?.email ?? '') && email.length > 0 ? true : undefined}
            />
            <Button 
              onClick={() => void saveProfile({ email })} 
              disabled={saving || email === (me?.email ?? '') || !validateEmail(email)}
            >
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

      <div className="mt-2 flex flex-col gap-2 rounded-lg border border-destructive/40 p-4">
        <span className="text-sm font-medium text-destructive">
          {t('settings.account.dangerZone')}
        </span>
        <p className="text-xs text-muted-foreground">
          {t('settings.account.deleteHint')}
        </p>
        <Button
          variant="destructive"
          className="self-start"
          onClick={() => setConfirmOpen(true)}
        >
          {t('settings.account.deleteAccount')}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.account.deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('settings.account.deleteConfirmBody')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={deleting}>
                {t('settings.account.deleteCancel')}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void onDelete()}
            >
              {t('settings.account.deleteConfirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
