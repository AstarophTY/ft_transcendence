import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Box, CalendarClock, Check, Eye, Loader2, Medal, Trophy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog.tsx'
import { Button } from '@/ui/shadcn/button.tsx'
import { Badge } from '@/ui/shadcn/badge.tsx'
import { ScrollArea } from '@/ui/shadcn/scroll-area.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs.tsx'
import { useSeason } from '@/store/season.ts'
import { usePlanetStore } from '@/store/planetStore.ts'
import { getUserId } from '@/lib/user.ts'
import type { BallotCandidate, SeasonPhase } from '@/types/api/season.ts'
import { cn } from '@/lib/utils.ts'
import { VotePreview } from './VotePreview.tsx'
import { useIsMobile } from '@/hooks/use-mobile.tsx'

const PHASE_VARIANT: Record<SeasonPhase, 'secondary' | 'warning' | 'default'> = {
  UPCOMING: 'secondary',
  BUILD: 'default',
  DELAY: 'warning',
  VOTE: 'default',
  ENDED: 'secondary',
}

/** Live countdown to a target ISO date; renders nothing once elapsed. */
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
    <span className="ml-auto flex items-center gap-1 tabular-nums text-muted-foreground">
      <CalendarClock className="size-3.5" />
      {t('season.endsIn')} {h > 0 ? `${h}:` : ''}
      {pad(m)}:{pad(sec)}
    </span>
  )
}

function CandidateRow({
  candidate,
  isWinning,
  isMyVote,
  isOwn,
  canVote,
  hasVoted,
  onVote,
  onVisit,
  onPreview,
}: {
  candidate: BallotCandidate
  isWinning: boolean
  isMyVote: boolean
  isOwn: boolean
  canVote: boolean
  /** True once the user has cast their island vote — locks out the other rows. */
  hasVoted: boolean
  onVote: () => void
  onVisit: () => void
  onPreview: () => void
}) {
  const { t } = useTranslation()
  const initial = candidate.username.charAt(0).toUpperCase()
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border px-3 py-2.5',
        isMyVote && 'border-primary bg-primary/5',
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {candidate.avatar ? (
          <img
            src={candidate.avatar}
            alt={candidate.username}
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initial}
          </span>
        )}
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="flex items-center gap-1 truncate text-sm font-medium">
            {isWinning && candidate.votes > 0 && (
              <Trophy className="size-3.5 shrink-0 text-yellow-500" />
            )}
            {candidate.username}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('season.votesCount', { count: candidate.votes })}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5 text-xs" onClick={onPreview}>
          <Box className="size-3.5" /> {t('season.preview3d')}
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5 text-xs" onClick={onVisit}>
          <Eye className="size-3.5" /> {t('season.visit')}
        </Button>
        {canVote &&
          (isOwn ? (
            <Badge variant="outline" className="h-6 shrink-0 text-[10px]">
              {t('season.yourIsland')}
            </Badge>
          ) : isMyVote ? (
            <Button variant="secondary" size="sm" disabled className="h-8 gap-1.5 px-2.5 text-xs">
              <Check className="size-3.5" /> {t('season.voted')}
            </Button>
          ) : hasVoted ? null : (
            <Button size="sm" className="h-8 text-xs px-3" onClick={onVote}>
              {t('season.vote')}
            </Button>
          ))}
      </div>
    </div>
  )
}

const MEDAL_COLORS = ['text-yellow-500', 'text-zinc-400', 'text-amber-700']

/** Player-facing season ballot: browse every campus's islands and vote. */
export default function SeasonDialog() {
  const { t } = useTranslation()
  const { open, setOpen, ballot, phase, loading, vote, voteCampus } = useSeason()
  const myId = getUserId()
  const visitIsland = usePlanetStore((s) => s.visitIsland)
  const visitCampus = usePlanetStore((s) => s.visitCampus)
  // Floating, draggable 3D preview of a candidate's island, shown above the
  // ballot without leaving it. `canVote` lets the user vote straight from it.
  const [preview, setPreview] = useState<{ userId: string; canVote: boolean } | null>(null)

  const visit = (userId: string) => {
    visitIsland(userId)
    setOpen(false)
  }

  const goCampus = (campusId: string) => {
    visitCampus(campusId)
    setOpen(false)
  }

  // Campuses ranked by the campus-level votes from campus-less accounts.
  const podium = ballot
    ? [...ballot.campuses].sort((a, b) => b.campusVotes - a.campusVotes)
    : []
  const showPodium = phase === 'VOTE' || phase === 'ENDED'
  const isMobile = useIsMobile()

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "max-w-lg",
          isMobile && "fixed inset-0 w-screen h-screen max-w-none translate-x-0 translate-y-0 top-0 left-0 rounded-none border-none flex flex-col overflow-y-auto pt-14 p-6 animate-none"
        )}
        // The 3D preview floats above the dialog in its own portal; interacting
        // with it must not dismiss the ballot behind it.
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement | null)?.closest('[data-vote-preview]')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-yellow-500" />
            {ballot?.season?.title ?? t('season.dialogTitle')}
            {phase && (
              <Badge variant={PHASE_VARIANT[phase]}>{t(`season.phase.${phase}`)}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>{t('season.dialogDescription')}</DialogDescription>
        </DialogHeader>

        {loading && !ballot ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="season" className="w-full flex flex-col flex-1">
            <TabsList className={cn(
              "grid w-full grid-cols-2",
              isMobile && "flex flex-row overflow-x-auto scrollbar-none justify-start p-1 shrink-0"
            )}>
              <TabsTrigger
                value="season"
                className={cn(isMobile && "shrink-0 px-4")}
              >
                {t('season.tabs.current')}
              </TabsTrigger>
              <TabsTrigger
                value="winners"
                className={cn(isMobile && "shrink-0 px-4")}
              >
                {t('season.tabs.winners')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="season" className="flex-1 flex flex-col gap-4">
              {!ballot?.season || !phase ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t('season.noSeason')}
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t(`season.phaseHint.${phase}`)}</span>
              <Countdown
                target={phase === 'VOTE' ? ballot.season.voteEndsAt : ballot.season.voteStartsAt}
              />
            </div>

            {showPodium && (
              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Trophy className="size-4 text-yellow-500" />
                  {t('season.podium.title')}
                </span>
                {podium.map((campus, index) => (
                  <div
                    key={campus.campusId}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-md p-1.5 border border-border/10 sm:border-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {index < 3 ? (
                        <Medal className={cn('size-4 shrink-0', MEDAL_COLORS[index])} />
                      ) : (
                        <span className="w-4 shrink-0 text-center text-xs text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {campus.label}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {t('season.votesCount', { count: campus.campusVotes })}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 px-2.5 text-xs"
                        onClick={() => goCampus(campus.campusId)}
                      >
                        <Eye className="size-3.5" /> {t('season.visit')}
                      </Button>
                      {ballot.canVoteCampus &&
                        (ballot.myCampusVoteId === campus.campusId ? (
                          <Button variant="secondary" size="sm" disabled className="h-8 gap-1.5 px-2.5 text-xs">
                            <Check className="size-3.5" /> {t('season.voted')}
                          </Button>
                        ) : ballot.myCampusVoteId ? null : (
                          <Button size="sm" className="h-8 text-xs px-3" onClick={() => void voteCampus(campus.campusId)}>
                            {t('season.vote')}
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <ScrollArea className="max-h-[50vh] pr-3">
              <div className="flex flex-col gap-4">
                {ballot.campuses.map((campus) => (
                  <div key={campus.campusId} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{campus.label}</span>
                      {campus.isOwn && (
                        <Badge variant="secondary">{t('season.yourCampus')}</Badge>
                      )}
                    </div>
                    {campus.candidates.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {t('season.noCandidates')}
                      </p>
                    ) : (
                      campus.candidates.map((candidate, index) => (
                        <CandidateRow
                          key={candidate.userId}
                          candidate={candidate}
                          isWinning={index === 0}
                          isMyVote={ballot.myVoteCandidateId === candidate.userId}
                          isOwn={candidate.userId === myId}
                          canVote={ballot.canVote && campus.isOwn}
                          hasVoted={!!ballot.myVoteCandidateId}
                          onVote={() => void vote(candidate.userId)}
                          onVisit={() => visit(candidate.userId)}
                          onPreview={() =>
                            setPreview({
                              userId: candidate.userId,
                              canVote:
                                ballot.canVote &&
                                campus.isOwn &&
                                !ballot.myVoteCandidateId &&
                                candidate.userId !== myId,
                            })
                          }
                        />
                      ))
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
                </>
              )}
            </TabsContent>

            <TabsContent value="winners" className="flex-1">
              {!ballot || ballot.previousWinners.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t('season.noWinners')}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {ballot.previousSeasonTitle && (
                    <p className="text-xs text-muted-foreground">
                      {t('season.winnersFrom', { title: ballot.previousSeasonTitle })}
                    </p>
                  )}
                  <ScrollArea className="max-h-[55vh] pr-3">
                    <div className="flex flex-col gap-2">
                      {ballot.previousWinners.map((w) => (
                        <div
                          key={w.campusId}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border px-3 py-2.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {w.avatar ? (
                              <img
                                src={w.avatar}
                                alt={w.username ?? w.campusLabel}
                                className="size-8 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                                {(w.username ?? w.campusLabel).charAt(0).toUpperCase()}
                              </span>
                            )}
                            <div className="flex min-w-0 flex-col leading-tight">
                              <span className="truncate text-sm font-medium">{w.campusLabel}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {(w.username ?? t('season.deletedUser')) +
                                  ' · ' +
                                  t('season.votesCount', { count: w.votes })}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 px-2.5 text-xs sm:ml-auto self-start sm:self-center"
                            onClick={() => goCampus(w.campusId)}
                          >
                            <Eye className="size-3.5" /> {t('season.visit')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
    {preview &&
      createPortal(
        <div data-vote-preview>
          <VotePreview
            userId={preview.userId}
            canVote={preview.canVote}
            onVote={() => {
              void vote(preview.userId)
              setPreview(null)
            }}
            onClose={() => setPreview(null)}
          />
        </div>,
        document.body,
      )}
    </>
  )
}
