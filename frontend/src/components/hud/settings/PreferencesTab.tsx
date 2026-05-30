import { useTranslation } from 'react-i18next'
import { useSettings } from '@/store/settings'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import Field from './Field'

const THEMES = ['light', 'dark'] as const

export default function PreferencesTab() {
  const { t, i18n } = useTranslation()
  const { me, saveProfile } = useSettings()

  const onLanguage = (language: string) => {
    void i18n.changeLanguage(language)
    void saveProfile({ language })
  }

  const onTheme = (theme: string) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    void saveProfile({ theme })
  }

  const select =
    'h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none'

  return (
    <div className="flex flex-col gap-4">
      <Field label={t('settings.prefs.language')}>
        <select
          className={select}
          value={me?.language ?? i18n.language}
          onChange={(e) => onLanguage(e.target.value)}
        >
          {SUPPORTED_LANGUAGES.map((lng) => (
            <option key={lng} value={lng}>
              {t(`language.${lng}`)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('settings.prefs.theme')}>
        <select
          className={select}
          value={me?.theme ?? 'dark'}
          onChange={(e) => onTheme(e.target.value)}
        >
          {THEMES.map((th) => (
            <option key={th} value={th}>
              {t(`settings.theme.${th}`)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}
