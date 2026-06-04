import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  ChevronDown,
  Coins,
  Minus,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UserMinus,
} from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import { Input } from '@/components/shadcn/input'
import { Badge } from '@/components/shadcn/badge'
import { ScrollArea } from '@/components/shadcn/scroll-area'
import Avatar from '@/components/hud/friends/Avatar'
import { useAdmin } from '@/store/admin'
import type { CampusWithMembers } from '@/lib/campus'
import { cn } from '@/lib/utils'

function CampusRow({ campus }: { campus: CampusWithMembers }) {
  const { t } = useTranslation()
  const { saveCampus, removeCampus, detachMember } = useAdmin()

  const [label, setLabel] = useState(campus.label)
  const [bonus, setBonus] = useState(String(campus.coins))
  const [seed, setSeed] = useState(campus.world?.seed || '')
  const [open, setOpen] = useState(false)

  const bonusValue = Number(bonus || 0)
  const dirty =
    label.trim() !== campus.label ||
    (Number.isFinite(bonusValue) && bonusValue !== campus.coins) ||
    seed.trim() !== (campus.world?.seed || '')

  // Keep the bonus a non-negative integer string and bump it with the steppers.
  const setBonusSafe = (value: string) => setBonus(value.replace(/\D/g, ''))
  const bump = (delta: number) =>
    setBonus(String(Math.max(0, bonusValue + delta)))

  const save = () => {
    if (!dirty) return
    void saveCampus(campus.id, {
      label: label.trim() || undefined,
      coins: Number.isFinite(bonusValue) ? bonusValue : undefined,
      seed: seed.trim() || undefined,
    })
  }

  const regenerate = () => {
    if (confirm(t('admin.campus.regenerateConfirm'))) {
      void saveCampus(campus.id, { regenerate: true })
    }
  }

  return (
    <li className="px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Building2 className="size-4 shrink-0 text-muted-foreground" />

        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={60}
          className="h-8 flex-1"
        />

        <Badge
          variant="secondary"
          className="gap-1 tabular-nums"
          title={t('admin.campus.totalHint')}
        >
          <Coins className="size-3.5 text-yellow-500" />
          {campus.totalCoins}
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          title={t('settings.save')}
          disabled={!dirty}
          onClick={save}
        >
          <Save className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => setOpen((v) => !v)}
        >
          <Badge variant="secondary" className="rounded-full px-1.5 text-[10px]">
            {campus.users.length}
          </Badge>
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
          />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          title={t('admin.campus.delete')}
          onClick={() => void removeCampus(campus)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {open && (
        <div className="mt-2 flex flex-col gap-2 border-t pt-2">
          {/* Planet terrain profile edit. */}
          <div className="flex items-center gap-2 text-sm">
            <span className="flex-1 text-muted-foreground font-medium">
              {t('admin.campus.planetConfig')}
            </span>
            <div className="flex items-center gap-1">
              <Input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder={t('admin.campus.seedPlaceholder')}
                className="h-8 w-32"
              />
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                title={t('admin.campus.regenerate')}
                onClick={regenerate}
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Admin bonus added on top of the members' earned coins. */}
          <div className="flex items-center gap-2 text-sm">
            <span className="flex-1 text-muted-foreground">
              {t('admin.campus.bonus')}
            </span>
            <div className="flex h-8 items-center overflow-hidden rounded-md border focus-within:ring-1 focus-within:ring-ring">
              <button
                type="button"
                onClick={() => bump(-1)}
                disabled={bonusValue <= 0}
                title={t('admin.campus.coinsDecrease')}
                className="flex h-full w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <Minus className="size-3.5" />
              </button>
              <div className="relative h-full border-x">
                <Coins className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-yellow-500" />
                <input
                  inputMode="numeric"
                  value={bonus}
                  onChange={(e) => setBonusSafe(e.target.value)}
                  onBlur={() => bonus === '' && setBonus('0')}
                  className="h-full w-16 bg-transparent pl-7 pr-2 text-sm tabular-nums outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => bump(1)}
                title={t('admin.campus.coinsIncrease')}
                className="flex h-full w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Members and their earned coins. */}
          <ul className="flex flex-col gap-1">
            {campus.users.length === 0 ? (
              <li className="px-1 py-1 text-xs text-muted-foreground">
                {t('admin.campus.noMembers')}
              </li>
            ) : (
              campus.users.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-accent"
                >
                  <Avatar src={m.avatar} name={m.username} size={26} />
                  <span className="flex-1 truncate text-sm">{m.username}</span>
                  {m.role === 'ADMIN' && (
                    <Badge variant="warning" className="text-[10px]">
                      {t('role.ADMIN')}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="gap-1 tabular-nums">
                    <Coins className="size-3 text-yellow-500" />
                    {m.coins}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    title={t('admin.campus.removeMember')}
                    onClick={() => void detachMember(campus.id, m.id)}
                  >
                    <UserMinus className="size-4" />
                  </Button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </li>
  )
}

export default function CampusManager() {
  const { t } = useTranslation()
  const { campuses } = useAdmin()

  if (campuses.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border text-sm text-muted-foreground">
        {t('admin.campus.noCampuses')}
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <ScrollArea className="max-h-[40vh]">
        <ul className="divide-y">
          {campuses.map((c) => (
            <CampusRow key={c.id} campus={c} />
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
