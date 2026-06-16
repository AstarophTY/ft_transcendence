import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/ui/shadcn/button.tsx'
import { Input } from '@/ui/shadcn/input.tsx'
import { useSettings } from '@/store/settings.ts'
import Field from '@/ui/hud/settings/Field.tsx'
import { cn, PASSWORD_RULES, validatePassword } from '@/lib/utils.ts'

function PasswordChecklist({ password }: { password: string }) {
  const { t } = useTranslation()
  if (password.length === 0) return null
  return (
    <ul className="mt-1 space-y-1">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password)
        return (
          <li
            key={rule.key}
            className={cn(
              'flex items-center gap-1.5 text-xs',
              ok ? 'text-green-600' : 'text-muted-foreground',
            )}
          >
            <span>{ok ? '✓' : '•'}</span>
            <span>{t(`auth.${rule.key}`)}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default function SecurityTab() {
  const { t } = useTranslation()
  const { saving, updatePassword } = useSettings()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  const passwordValid = validatePassword(next)
  const passwordInvalid = next.length > 0 && !passwordValid
  const mismatch = confirm.length > 0 && next !== confirm
  const canSubmit = current && next && passwordValid && next === confirm && !saving

  const submit = async () => {
    if (await updatePassword(current, next)) {
      setCurrent('')
      setNext('')
      setConfirm('')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label={t('settings.security.current')}>
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label={t('settings.security.new')}>
        <Input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          aria-invalid={passwordInvalid || undefined}
        />
        <PasswordChecklist password={next} />
      </Field>
      <Field
        label={t('settings.security.confirm')}
        hint={mismatch ? t('settings.security.mismatch') : undefined}
      >
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={mismatch || undefined}
        />
      </Field>
      <Button onClick={() => void submit()} disabled={!canSubmit} className="self-start">
        {t('settings.security.update')}
      </Button>
    </div>
  )
}
