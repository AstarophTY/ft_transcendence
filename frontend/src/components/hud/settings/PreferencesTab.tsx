import { useEffect, useRef, useState } from 'react'
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
import { ColorPicker } from '@/components/shadcn/color-picker'
import Field from './Field'
import { usePlanetStore } from '@/store/planetStore'
import { usePlayerAppearance } from '@/ui/three/objects/player/playerAppearance'
import { DEFAULT_SKIN_COLOR } from '@/config/playerAppearance'

const THEMES = ['light', 'dark'] as const

export default function PreferencesTab() {
  const { t, i18n } = useTranslation()
  const { me, saveProfile } = useSettings()
  const storedTheme = localStorage.getItem('theme')
  const { renderDistance, setRenderDistance } = usePlanetStore()
  const setSkinColor = usePlayerAppearance((s) => s.setSkinColor)

  // Skin color is applied live to the 3D avatar and saved when this tab closes.
  const initialSkin = me?.skinColor ?? DEFAULT_SKIN_COLOR
  const [skin, setSkin] = useState(initialSkin)
  const skinRef = useRef(skin)
  skinRef.current = skin

  const onSkinChange = (color: string) => {
    setSkin(color)
    setSkinColor(color)
  }

  useEffect(() => {
    // Persist the chosen skin once, when this tab/dialog closes (unmount).
    return () => {
      if (skinRef.current !== initialSkin) {
        void saveProfile({ skinColor: skinRef.current })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <Field label={t('settings.prefs.skin', { defaultValue: 'Avatar color' })}>
        <ColorPicker value={skin} onChange={onSkinChange} />
      </Field>

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
