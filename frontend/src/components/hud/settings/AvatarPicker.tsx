import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { useSettings } from '@/store/settings'
import Avatar from '@/components/hud/friends/Avatar'

export default function AvatarPicker() {
  const { t } = useTranslation()
  const { me, saving, changeAvatar } = useSettings()
  const inputRef = useRef<HTMLInputElement>(null)

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void changeAvatar(file)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar src={me?.avatar} name={me?.username ?? '?'} size={64} />
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={saving}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="size-4" />
          {t('settings.profile.changeAvatar')}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t('settings.profile.avatarHint')}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />
    </div>
  )
}
