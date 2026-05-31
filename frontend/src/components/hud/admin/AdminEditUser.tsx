import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog'
import { Button } from '@/components/shadcn/button'
import { Input } from '@/components/shadcn/input'
import { useAdmin } from '@/store/admin'
import Avatar from '@/components/hud/friends/Avatar'
import Field from '@/components/hud/settings/Field'
import type { UserStatus } from '@/lib/account'

const STATUSES: UserStatus[] = ['ONLINE', 'AWAY', 'DND', 'OFFLINE']

const select =
  'h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

export default function AdminEditUser() {
  const { t } = useTranslation()
  const { editing, setEditing, saveUser, resetPassword } = useAdmin()

  const [displayName, setDisplayName] = useState(editing?.displayName ?? '')
  const [bio, setBio] = useState(editing?.bio ?? '')
  const [email, setEmail] = useState(editing?.email ?? '')
  const [campus, setCampus] = useState(editing?.campus ?? '')
  const [status, setStatus] = useState<UserStatus>(editing?.status ?? 'ONLINE')
  const [statusMessage, setStatusMessage] = useState(editing?.statusMessage ?? '')
  const [password, setPassword] = useState('')

  if (!editing) return null
  const is42 = Boolean(editing.fortyTwoLogin)

  const save = () =>
    void saveUser(editing.id, {
      displayName,
      bio,
      email,
      campus,
      status,
      statusMessage,
    })

  const reset = async () => {
    if (await resetPassword(editing.id, password)) setPassword('')
  }

  return (
    <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar src={editing.avatar} name={editing.username} size={40} />
            <div>
              <DialogTitle className="leading-tight">{editing.username}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {editing.email ?? editing.fortyTwoLogin ?? '—'}
                {is42 && (
                  <span className="ml-2 rounded bg-secondary px-1 py-0.5 text-[10px] font-semibold">
                    42
                  </span>
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('admin.edit.infoSection')}
            </p>
            <div className="flex flex-col gap-3">
              <Field label={t('admin.edit.displayName')}>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={40}
                  placeholder={editing.username}
                />
              </Field>

              <Field label={t('admin.edit.bio')}>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={280}
                  rows={3}
                  className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </Field>

              <Field
                label={t('settings.account.email')}
                hint={is42 ? t('settings.account.email42Hint') : undefined}
              >
                <Input
                  type="email"
                  value={email}
                  disabled={is42}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field label={t('settings.account.campus')}>
                <Input
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('admin.edit.status')}
            </p>
            <div className="flex flex-col gap-3">
              <Field label={t('admin.edit.status')}>
                <select
                  className={select}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UserStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`settings.status.${s}`)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t('admin.edit.statusMessage')}>
                <Input
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  maxLength={80}
                />
              </Field>
            </div>
          </section>

          <Button onClick={save} className="self-start">
            {t('settings.save')}
          </Button>

          {!is42 && (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('admin.edit.securitySection')}
              </p>
              <Field label={t('admin.edit.newPassword')}>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => void reset()}
                    disabled={!password}
                  >
                    {t('admin.edit.reset')}
                  </Button>
                </div>
              </Field>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
