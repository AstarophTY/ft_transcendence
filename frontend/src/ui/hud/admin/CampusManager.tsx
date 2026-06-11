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
  Search,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/ui/shadcn/button.tsx'
import { Input } from '@/ui/shadcn/input.tsx'
import { Badge } from '@/ui/shadcn/badge.tsx'
import { ConfirmDialog } from '@/ui/shadcn/confirm-dialog.tsx'
import { ScrollArea } from '@/ui/shadcn/scroll-area.tsx'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/ui/shadcn/popover.tsx'
import Avatar from '@/ui/hud/friends/Avatar.tsx'
import { useAdmin } from '@/store/admin.ts'
import type { CampusWithMembers } from '@/lib/api/campus.ts'
import { cn } from '@/lib/utils.ts'

/** Pick a user not yet in the campus and attach them. */
function AddMemberPicker({ campus }: { campus: CampusWithMembers }) {
  const { t } = useTranslation()
  const { users, attachMember } = useAdmin()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const memberIds = new Set(campus.users.map((m) => m.id))
  const q = search.toLowerCase()
  const candidates = users.filter(
    (u) =>
      !memberIds.has(u.id) &&
      (!q ||
        u.username.toLowerCase().includes(q) ||
        (u.displayName ?? '').toLowerCase().includes(q)),
  )

  const add = (id: string) => {
    void attachMember(campus.id, id)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 self-start">
          <UserPlus className="size-4" />
          {t('admin.campus.addMember')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="relative border-b">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.search')}
            className="h-9 border-0 pl-8 focus-visible:ring-0"
          />
        </div>
        <ScrollArea className="max-h-56">
          {candidates.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {t('admin.campus.noUsersToAdd')}
            </p>
          ) : (
            <ul className="p-1">
              {candidates.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => add(u.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    <Avatar src={u.avatar} name={u.username} size={24} />
                    <span className="flex-1 truncate">{u.username}</span>
                    {u.campus && (
                      <Badge variant="secondary" className="text-[10px]">
                        {u.campus.label}
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

/** Create a campus from just a name. */
function CreateCampusForm() {
  const { t } = useTranslation()
  const { createCampus } = useAdmin()
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const name = label.trim()
    if (!name || busy) return
    setBusy(true)
    const ok = await createCampus(name)
    setBusy(false)
    if (ok) setLabel('')
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Building2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void submit()}
          maxLength={60}
          placeholder={t('admin.campus.namePlaceholder')}
          className="pl-9"
        />
      </div>
      <Button
        className="gap-1.5"
        disabled={!label.trim() || busy}
        onClick={() => void submit()}
      >
        <Plus className="size-4" />
        {t('admin.campus.create')}
      </Button>
    </div>
  )
}

function CampusRow({ campus }: { campus: CampusWithMembers }) {
  const { t } = useTranslation()
  const { saveCampus, removeCampus, detachMember } = useAdmin()

  const [label, setLabel] = useState(campus.label)
  const [bonus, setBonus] = useState(String(campus.coins))
  const [seed, setSeed] = useState(campus.world?.seed || '')
  const [open, setOpen] = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)

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
    void saveCampus(campus.id, { regenerate: true })
    setConfirmRegen(false)
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
                onClick={() => setConfirmRegen(true)}
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
          <AddMemberPicker campus={campus} />
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

      <ConfirmDialog
        open={confirmRegen}
        onOpenChange={setConfirmRegen}
        title={t('admin.campus.regenerateTitle')}
        description={t('admin.campus.regenerateConfirm')}
        confirmLabel={t('admin.campus.regenerateAction')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={regenerate}
      />
    </li>
  )
}

export default function CampusManager() {
  const { t } = useTranslation()
  const { campuses } = useAdmin()

  return (
    <div className="flex flex-col gap-3">
      <CreateCampusForm />

      {campuses.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-lg border text-sm text-muted-foreground">
          {t('admin.campus.noCampuses')}
        </div>
      ) : (
        <div className="rounded-lg border">
          <ScrollArea className="max-h-[40vh] overflow-y-scroll overflow-x-hidden [scrollbar-width:none]">
            <ul className="divide-y">
              {campuses.map((c) => (
                <CampusRow key={c.id} campus={c} />
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
