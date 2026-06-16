import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  CalendarClock,
  ChevronDown,
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
import { cn } from '@/lib/utils.ts'
import { useSeason } from '@/store/season.ts'
import {FormState} from "@/types/hud/admin/formState.ts";
import {Season, SeasonInput, SeasonPhase} from "@/types/api/season.ts";

/** A titled, collapsible section — keeps the bulky season forms out of the way. */
function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <ChevronDown className={cn('ml-auto size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="flex flex-col gap-3 border-t p-3">{children}</div>}
    </div>
  )
}

/** ISO string -> value for an <input type="datetime-local"> (local time). */
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const minutesBetween = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(a).getTime() - new Date(b).getTime()) / 60_000))

const EMPTY_FORM: FormState = { title: '', buildStartsAt: '', buildEndsAt: '', delay: '0', duration: '60' }

/** The computed vote window (open → close) implied by a form's inputs. */
function voteWindow(s: FormState): { open: Date; close: Date } | null {
  if (!s.buildEndsAt) return null
  const end = new Date(s.buildEndsAt)
  if (Number.isNaN(end.getTime())) return null
  const open = new Date(end.getTime() + (Number(s.delay) || 0) * 60_000)
  const close = new Date(open.getTime() + (Number(s.duration) || 1) * 60_000)
  return { open, close }
}

function toBody(s: FormState): SeasonInput {
  return {
    title: s.title.trim(),
    buildStartsAt: s.buildStartsAt ? new Date(s.buildStartsAt).toISOString() : '',
    buildEndsAt: s.buildEndsAt ? new Date(s.buildEndsAt).toISOString() : '',
    voteDelayMinutes: Number(s.delay) || 0,
    voteDurationMinutes: Number(s.duration) || 1,
  }
}

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

/** The shared title / build window / vote timing inputs of a season form. */
function SeasonFields({
  state,
  set,
  idPrefix,
}: {
  state: FormState
  set: (patch: Partial<FormState>) => void
  idPrefix: string
}) {
  const { t } = useTranslation()
  const datesValid =
    !state.buildStartsAt ||
    !state.buildEndsAt ||
    new Date(state.buildEndsAt).getTime() > new Date(state.buildStartsAt).getTime()
  const win = voteWindow(state)
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-title`}>{t('season.admin.title')}</Label>
        <Input
          id={`${idPrefix}-title`}
          value={state.title}
          onChange={(e) => set({ title: e.target.value })}
          maxLength={120}
          placeholder={t('season.admin.titlePlaceholder')}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-build-start`}>{t('season.admin.buildStart')}</Label>
          <DateTimePicker
            id={`${idPrefix}-build-start`}
            value={state.buildStartsAt}
            onChange={(v) => set({ buildStartsAt: v })}
            placeholder={t('season.admin.pickDate')}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-build-end`}>{t('season.admin.buildEnd')}</Label>
          <DateTimePicker
            id={`${idPrefix}-build-end`}
            value={state.buildEndsAt}
            onChange={(v) => set({ buildEndsAt: v })}
            placeholder={t('season.admin.pickDate')}
          />
        </div>
        {!datesValid && (
          <p className="col-span-2 text-xs text-destructive">
            {t('season.admin.datesInvalid', { defaultValue: 'End date must be after start date.' })}
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-delay`}>{t('season.admin.delay')}</Label>
          <Input
            id={`${idPrefix}-delay`}
            inputMode="numeric"
            value={state.delay}
            onChange={(e) => set({ delay: e.target.value.replace(/\D/g, '') })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-duration`}>{t('season.admin.duration')}</Label>
          <Input
            id={`${idPrefix}-duration`}
            inputMode="numeric"
            value={state.duration}
            onChange={(e) => set({ duration: e.target.value.replace(/\D/g, '') })}
          />
        </div>
      </div>
      {win && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" />
          {t('season.admin.votePreview', {
            start: win.open.toLocaleString(),
            end: win.close.toLocaleString(),
          })}
        </p>
      )}
    </>
  )
}

export default function SeasonAdminPanel() {
  const { t } = useTranslation()
  const { season, phase, next, seasons, loading, load, loadSeasons, saveSeason, editSeason, removeSeason, endBuild, openVote, closeVote, finalize } =
    useSeason()

  // Two independent forms: one edits the running season, one schedules a new one.
  const [edit, setEdit] = useState<FormState>(EMPTY_FORM)
  const [draft, setDraft] = useState<FormState>(EMPTY_FORM)
  // The season pending deletion, shown in the confirm dialog.
  const [pendingDelete, setPendingDelete] = useState<Season | null>(null)
  // Set while an immediate (build starts now) schedule awaits confirmation.
  const [pendingTakeover, setPendingTakeover] = useState(false)

  useEffect(() => {
    void load()
    void loadSeasons()
  }, [load, loadSeasons])

  // Prefill the edit form from the running season.
  useEffect(() => {
    if (!season) return
    setEdit({
      title: season.title,
      buildStartsAt: toLocalInput(season.buildStartsAt),
      buildEndsAt: toLocalInput(season.buildEndsAt),
      delay: String(minutesBetween(season.voteStartsAt, season.buildEndsAt)),
      duration: String(minutesBetween(season.voteEndsAt, season.voteStartsAt)),
    })
  }, [season])

  const editValidity = useMemo(() => formValidity(edit), [edit])
  const draftValidity = useMemo(() => formValidity(draft), [draft])

  // An immediate takeover ends the running season and wipes every world.
  const draftImmediate =
    Boolean(draft.buildStartsAt) && new Date(draft.buildStartsAt).getTime() <= Date.now()
  const wouldClobber = draftImmediate && Boolean(season) && phase !== null && phase !== 'ENDED'

  const submitDraft = async (force = false) => {
    const ok = await saveSeason(force ? { ...toBody(draft), force: true } : toBody(draft))
    if (ok) setDraft(EMPTY_FORM)
  }

  const onSchedule = () => {
    if (wouldClobber) {
      setPendingTakeover(true)
      return
    }
    void submitDraft()
  }

  if (loading && !season && seasons.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
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

      {/* Quick fast-forward controls for the running season — always visible. */}
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

      {/* Edit the running season's window — collapsed by default to save space. */}
      {season && (
        <Section title={t('season.admin.editHeading')}>
          <SeasonFields state={edit} set={(p) => setEdit((s) => ({ ...s, ...p }))} idPrefix="season-edit" />
          <Button
            variant="secondary"
            className="gap-1.5"
            disabled={!editValidity.valid}
            onClick={() => void editSeason(toBody(edit))}
          >
            <Save className="size-4" /> {t('settings.save')}
          </Button>
        </Section>
      )}

      {/* Schedule a new season (queued when in the future, immediate when now). */}
      <Section title={t('season.admin.scheduleHeading')} defaultOpen={!season}>
        <SeasonFields state={draft} set={(p) => setDraft((s) => ({ ...s, ...p }))} idPrefix="season-new" />
        {draftValidity.windowPast && (
          <p className="text-xs text-destructive">{t('season.admin.windowPast')}</p>
        )}
        {wouldClobber && (
          <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
            <AlertTriangle className="size-3.5 shrink-0" />
            {t('season.admin.takeoverWarn')}
          </p>
        )}
        <Button
          className="gap-1.5"
          variant={draftImmediate ? 'destructive' : 'default'}
          disabled={!draftValidity.valid}
          onClick={onSchedule}
        >
          <Trophy className="size-4" />
          {draftImmediate
            ? t('season.admin.startNow')
            : season
              ? t('season.admin.queue')
              : t('season.admin.create')}
        </Button>
      </Section>

      {/* Full history: past, running and queued seasons — collapsed + scrollable. */}
      <Section title={`${t('season.admin.allSeasons')} (${seasons.length})`}>
        {seasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('season.admin.noSeasons')}</p>
        ) : (
          <ul className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
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
      </Section>

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

      <ConfirmDialog
        open={pendingTakeover}
        onOpenChange={(o) => !o && setPendingTakeover(false)}
        title={t('season.admin.takeoverTitle')}
        description={t('season.admin.takeoverConfirm', { title: season?.title ?? '' })}
        confirmLabel={t('season.admin.startNow')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          setPendingTakeover(false)
          void submitDraft(true)
        }}
      />
    </div>
  )
}

/** Whether a season form is submittable, and why not. */
function formValidity(s: FormState): { valid: boolean; windowPast: boolean } {
  const body = toBody(s)
  const datesValid =
    !s.buildStartsAt ||
    !s.buildEndsAt ||
    new Date(s.buildEndsAt).getTime() > new Date(s.buildStartsAt).getTime()
  const win = voteWindow(s)
  const windowPast = win ? win.close.getTime() <= Date.now() : false
  const valid = Boolean(body.title && body.buildStartsAt && body.buildEndsAt && datesValid && !windowPast)
  return { valid, windowPast }
}
