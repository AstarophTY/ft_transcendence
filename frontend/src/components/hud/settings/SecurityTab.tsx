import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shadcn/button'
import { Input } from '@/components/shadcn/input'
import { useSettings } from '@/store/settings'
import Field from './Field'

export default function SecurityTab() {
  const { t } = useTranslation()
  const { saving, updatePassword } = useSettings()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  const mismatch = confirm.length > 0 && next !== confirm
  const canSubmit = current && next && next === confirm && !saving

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
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      <Field
        label={t('settings.security.confirm')}
        hint={mismatch ? t('settings.security.mismatch') : undefined}
      >
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <Button onClick={() => void submit()} disabled={!canSubmit} className="self-start">
        {t('settings.security.update')}
      </Button>
    </div>
  )
}
