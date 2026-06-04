import { useTranslation } from 'react-i18next'
import { useSettings } from '@/store/settings.ts'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select.tsx'
import Field from './Field.tsx'
import { usePlanetStore } from '@/store/planetStore.ts'

const THEMES = ['light', 'dark'] as const

export default function PreferencesTab() {
  const { t, i18n } = useTranslation()
  const { me, saveProfile } = useSettings()
  const storedTheme = localStorage.getItem('theme')
  const { renderDistance, setRenderDistance } = usePlanetStore()

  const onLanguage = (language: string) => {
    void i18n.changeLanguage(language)
    void saveProfile({ language })
  }

  const onTheme = (theme: string) => {
    usePlanetStore.getState().setTheme(theme as 'light' | 'dark')
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

      <Field label={t('settings.prefs.renderDistance')}>
        <Select
          value={renderDistance.toString()}
          onValueChange={(val) => setRenderDistance(parseInt(val, 10))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[4, 6, 8, 10, 12, 14, 16].map((dist) => (
              <SelectItem key={dist} value={dist.toString()}>
                {dist} {t('settings.prefs.chunks')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}
