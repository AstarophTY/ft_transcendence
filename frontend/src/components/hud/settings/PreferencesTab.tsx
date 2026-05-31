import { useTranslation } from 'react-i18next'
import { useSettings } from '@/store/settings'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select'
import Field from './Field'

const THEMES = ['light', 'dark'] as const

export default function PreferencesTab() {
  const { t, i18n } = useTranslation()
  const { me, saveProfile } = useSettings()
  const storedTheme = localStorage.getItem('theme')

  const onLanguage = (language: string) => {
    void i18n.changeLanguage(language)
    void saveProfile({ language })
  }

  const onTheme = (theme: string) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
    void saveProfile({ theme })
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label={t('settings.prefs.language')}>
        <Select value={me?.language ?? i18n.language} onValueChange={onLanguage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lng) => (
              <SelectItem key={lng} value={lng}>
                {t(`language.${lng}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label={t('settings.prefs.theme')}>
        <Select
          value={me?.theme ?? storedTheme ?? 'dark'}
          onValueChange={onTheme}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEMES.map((th) => (
              <SelectItem key={th} value={th}>
                {t(`settings.theme.${th}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}
