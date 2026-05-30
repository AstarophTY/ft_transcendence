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
import Field from '@/components/hud/settings/Field'

export default function AdminEditUser() {
  const { t } = useTranslation()
  const { editing, setEditing, saveUser, resetPassword } = useAdmin()
  const [email, setEmail] = useState(editing?.email ?? '')
  const [campus, setCampus] = useState(editing?.campus ?? '')
  const [password, setPassword] = useState('')

  if (!editing) return null
  const is42 = Boolean(editing.fortyTwoLogin)

  const save = () => void saveUser(editing.id, { email, campus })
  const reset = async () => {
    if (await resetPassword(editing.id, password)) setPassword('')
  }

  return (
    <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing.username}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field
            label={t('settings.account.email')}
            hint={is42 ? t('settings.account.email42Hint') : undefined}
          >
            <Input type="email" value={email} disabled={is42} onChange={(e) => setEmail(e.target.value)} />
          </Field>

          <Field label={t('settings.account.campus')}>
            <Input value={campus} onChange={(e) => setCampus(e.target.value)} />
          </Field>

          <Button onClick={save} className="self-start">
            {t('settings.save')}
          </Button>

          {!is42 && (
            <Field label={t('admin.edit.newPassword')}>
              <div className="flex gap-2">
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button variant="outline" onClick={() => void reset()} disabled={!password}>
                  {t('admin.edit.reset')}
                </Button>
              </div>
            </Field>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
