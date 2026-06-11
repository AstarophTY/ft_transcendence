import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CalendarClock,
  FastForward,
  Flag,
  Loader2,
  Play,
  Save,
  Square,
  Trash2,
  Trophy,
} from 'lucide-react'
import { Button } from '@/ui/shadcn/button.tsx'
import { Input } from '@/ui/shadcn/input.tsx'
import { DateTimePicker } from '@/ui/shadcn/datetime-picker.tsx'
import { Label } from '@/ui/shadcn/label.tsx'
import { Badge } from '@/ui/shadcn/badge.tsx'
import { ConfirmDialog } from '@/ui/shadcn/confirm-dialog.tsx'
import { useSeason } from '@/store/season.ts'
import type { Season, SeasonPhase } from '@/lib/api/season.ts'

/** ISO string -> value for an <input type="datetime-local"> (local time). */
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const minutesBetween = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(a).getTime() - new Date(b).getTime()) / 60_000))

function phaseTarget(season: Season, phase: SeasonPhase): string | null {
  switch (phase) {
    case 'UPCOMING':
      return season.buildStartsAt
    case 'BUILD':
      return season.buildEndsAt
    case 'DELAY':
      return season.voteStartsAt
    case 'VOTE':
      return season.voteEndsAt
    default:
      return null
  }
}

function Countdown({ target }: { target: string | null }) {
  const { t } = useTranslation()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (!target) return null
  const ms = new Date(target).getTime() - now
  if (ms <= 0) return null
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <span className="tabular-nums text-muted-foreground">
      {t('season.admin.in')} {h > 0 ? `${h}:` : ''}
      {pad(m)}:{pad(sec)}
    </span>
  )
}

const PHASE_VARIANT: Record<SeasonPhase, 'secondary' | 'warning' | 'default'> = {
  UPCOMING: 'secondary',
  BUILD: 'default',
  DELAY: 'warning',
  VOTE: 'default',
  ENDED: 'secondary',
}

export default function SeasonAdminPanel() {
  const { t } = useTranslation()
  const { season, phase, next, seasons, loading, load, loadSeasons, saveSeason, editSeason, removeSeason, endBuild, openVote, closeVote, finalize } =
    useSeason()

  const [title, setTitle] = useState('')
  const [buildStartsAt, setBuildStartsAt] = useState('')
  const [buildEndsAt, setBuildEndsAt] = useState('')
  const [delay, setDelay] = useState('0')
  const [duration, setDuration] = useState('60')
  // The season pending deletion, shown in the confirm dialog.
  const [pendingDelete, setPendingDelete] = useState<Season | null>(null)

  useEffect(() => {
    void load()
    void loadSeasons()
  }, [load, loadSeasons])

  // Prefill the form from the running season.
  useEffect(() => {
    if (!season) return
    setTitle(season.title)
    setBuildStartsAt(toLocalInput(season.buildStartsAt))
    setBuildEndsAt(toLocalInput(season.buildEndsAt))
    setDelay(String(minutesBetween(season.voteStartsAt, season.buildEndsAt)))
    setDuration(String(minutesBetween(season.voteEndsAt, season.voteStartsAt)))
  }, [season])

  const body = useMemo(
    () => ({
      title: title.trim(),
      buildStartsAt: buildStartsAt ? new Date(buildStartsAt).toISOString() : '',
      buildEndsAt: buildEndsAt ? new Date(buildEndsAt).toISOString() : '',
      voteDelayMinutes: Number(delay) || 0,
      voteDurationMinutes: Number(duration) || 1,
    }),
    [title, buildStartsAt, buildEndsAt, delay, duration],
  )

  const datesValid =
    !buildStartsAt ||
    !buildEndsAt ||
    new Date(buildEndsAt).getTime() > new Date(buildStartsAt).getTime()

  const valid = body.title && body.buildStartsAt && body.buildEndsAt && datesValid

  if (loading && !season) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {season && phase && (
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <Trophy className="size-4 text-yellow-500" />
          <span className="font-medium">{season.title}</span>
          <Badge variant={PHASE_VARIANT[phase]}>{t(`season.phase.${phase}`)}</Badge>
          <span className="ml-auto flex items-center gap-1">
            <CalendarClock className="size-3.5 text-muted-foreground" />
            <Countdown target={phaseTarget(season, phase)} />
          </span>
        </div>
      )}

      {/* A season scheduled to take over once its build phase begins. */}
      {next && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm">
          <CalendarClock className="size-4 text-muted-foreground" />
          <span className="font-medium">{next.title}</span>
          <Badge variant="secondary">{t('season.phase.UPCOMING')}</Badge>
          <span className="ml-auto text-muted-foreground">
            {t('season.admin.startsOn', { date: new Date(next.buildStartsAt).toLocaleString() })}
          </span>
        </div>
      )}

      {/* Fast-forward controls for the running season. */}
      {season && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void endBuild()}>
            <FastForward className="size-4" /> {t('season.admin.endBuild')}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void openVote()}>
            <Play className="size-4" /> {t('season.admin.openVote')}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void closeVote()}>
            <Square className="size-4" /> {t('season.admin.closeVote')}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void finalize()}>
            <Flag className="size-4" /> {t('season.admin.finalize')}
          </Button>
        </div>
      )}

      {/* Season configuration form. */}
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="season-title">{t('season.admin.title')}</Label>
          <Input
            id="season-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder={t('season.admin.titlePlaceholder')}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="season-build-start">{t('season.admin.buildStart')}</Label>
            <DateTimePicker
              id="season-build-start"
              value={buildStartsAt}
              onChange={setBuildStartsAt}
              placeholder={t('season.admin.pickDate')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="season-build-end">{t('season.admin.buildEnd')}</Label>
            <DateTimePicker
              id="season-build-end"
              value={buildEndsAt}
              onChange={setBuildEndsAt}
              placeholder={t('season.admin.pickDate')}
            />
          </div>
          {!datesValid && (
            <p className="col-span-2 text-xs text-destructive">
              {t('season.admin.datesInvalid', { defaultValue: 'End date must be after start date.' })}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="season-delay">{t('season.admin.delay')}</Label>
            <Input
              id="season-delay"
              inputMode="numeric"
              value={delay}
              onChange={(e) => setDelay(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="season-duration">{t('season.admin.duration')}</Label>
            <Input
              id="season-duration"
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {season && (
            <Button
              variant="secondary"
              className="flex-1 gap-1.5"
              disabled={!valid}
              onClick={() => void editSeason(body)}
            >
              <Save className="size-4" /> {t('settings.save')}
            </Button>
          )}
          <Button
            className="flex-1 gap-1.5"
            disabled={!valid}
            onClick={() => void saveSeason(body)}
          >
            <Trophy className="size-4" />
            {season ? t('season.admin.queue') : t('season.admin.create')}
          </Button>
        </div>
      </div>

      {/* Full history: past, running and queued seasons. */}
      <div className="flex flex-col gap-2">
        <Label>{t('season.admin.allSeasons')}</Label>
        {seasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('season.admin.noSeasons')}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {seasons.map(({ season: s, phase: p }) => {
              const tag =
                s.id === season?.id
                  ? t('season.admin.statusActive')
                  : s.id === next?.id
                    ? t('season.admin.statusQueued')
                    : null
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{s.title}</span>
                  <Badge variant={PHASE_VARIANT[p]}>{t(`season.phase.${p}`)}</Badge>
                  {tag && <Badge variant="outline">{tag}</Badge>}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(s.buildStartsAt).toLocaleString()} →{' '}
                    {new Date(s.voteEndsAt).toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    title={t('season.admin.delete')}
                    onClick={() => setPendingDelete(s)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={t('season.admin.deleteTitle')}
        description={
          pendingDelete
            ? t('season.admin.deleteConfirm', { title: pendingDelete.title })
            : undefined
        }
        confirmLabel={t('season.admin.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          if (pendingDelete) void removeSeason(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
