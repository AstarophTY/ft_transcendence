import { useState, useMemo } from 'react'
import { X, User, Trophy, UserPlus, Loader2, GripHorizontal } from 'lucide-react'
import { getUserId } from '@/lib/user'
import { ScrollArea } from '@/ui/shadcn/scroll-area.tsx'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { api } from '@/lib/api'
import { motion, useDragControls } from 'motion/react';
import { useIsMobile } from '@/hooks/use-mobile.tsx'
import { Button } from '@/ui/shadcn/button.tsx'
import { useTranslation } from 'react-i18next'
import { getWorldSocket } from '@/lib/sockets/worldSocket'
import { VotePreview } from '@/ui/hud/VotePreview.tsx'

interface Candidate {
  userId: string
  username: string
  avatar: string | null
  votes: number
  isVoted: boolean
}

interface Contest {
  id: string
  title: string
  description: string | null
  candidates: Candidate[]
}

interface VoteOverlayProps {
  contests: Contest[]
  onUpdateContests: (contests: any[]) => void
  isPrivate?: boolean
}
 
export const VoteOverlay = ({ contests, onUpdateContests, isPrivate }: VoteOverlayProps) => {
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [votedContestIds, setVotedContestIds] = useState<Set<string>>(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const userId = getUserId();
  const { t } = useTranslation();
  const dragControls = useDragControls();
  const isMobile = useIsMobile();
  const socket = getWorldSocket();

  const handlePreview = (targetUserId: string) => {
    setPreviewUserId(targetUserId);
  }

  const handleVote = async (contestId: string, targetUserId: string) => {
    if (isVoting || !socket)
      return;
    setIsVoting(true);
    try {
      await socket.emit('vote:vote', { contestsId: contestId, userId: targetUserId });
      setVotedContestIds((prev) => new Set(prev).add(contestId));
      toast.success(i18n.t('world.voteSuccess', { defaultValue: 'Voted successfully!' }));
      const updated = contests.map(c => {
        if (c.id === contestId) {
          return {
            ...c,
            candidates: c.candidates.map(can => 
              can.userId === targetUserId && !can.isVoted ? { ...can, votes: can.votes + 1, isVoted: true } : can
            )
          }
        }
        return c;
      })
      onUpdateContests(updated);
      if (selectedContest?.id === contestId) {
        setSelectedContest(updated.find(u => u.id === contestId) || null);
      }
    } catch (err) {
      console.log(err);
      toast.error(i18n.t('world.voteError', { defaultValue: 'Failed to vote' }));
    } finally {
      setIsVoting(false);
    }
  }

  const handleJoin = async (contestId: string) => {
    if (isJoining) return
    setIsJoining(true)
    try {
      await api.post(`/vote/join/${contestId}`)
      toast.success(i18n.t('world.joinSuccess', { defaultValue: 'Joined contest successfully!' }))
      window.location.reload()
    } catch (err) {
      toast.error(i18n.t('world.joinError', { defaultValue: 'Failed to join contest' }))
    } finally {
      setIsJoining(false)
    }
  }

  const totalVotes = useMemo(() => {
    if (!selectedContest) return 0
    return selectedContest.candidates.reduce((sum, c) => sum + c.votes, 0)
  }, [selectedContest])

  if (contests.length === 0) return null

  return (
    <>
      <div className="absolute left-6 bottom-6 z-10 w-64 pointer-events-auto">
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Trophy className="h-5 w-5" />
            <h3 className="font-bold tracking-tight uppercase text-sm">Active Contests</h3>
          </div>
          <div className="space-y-2">
            {contests.map((contest) => (
              <button
                key={contest.id}
                onClick={() => setSelectedContest(contest)}
                className="w-full rounded-lg bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
              >
                <p className="font-medium text-sm leading-tight">{contest.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{contest.candidates.length} candidates</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedContest && (
        <div className="
          /* Desktop (Default) */
          absolute top-16 left-16 w-[550px] h-[450px] z-50
          
          /* Mobile Portrait */
          max-md:fixed max-md:bottom-0 max-md:inset-x-0 max-md:top-auto max-md:left-auto max-md:w-full max-md:h-[60vh]
          
          /* Mobile/Tablet Landscape */
          max-lg:landscape:fixed max-lg:landscape:top-0 max-lg:landscape:bottom-0 max-lg:landscape:right-0 max-lg:landscape:left-auto max-lg:landscape:w-[320px] max-lg:landscape:h-full
        ">

          <motion.div 
            key={isMobile ? 'mobile' : 'desktop'}
            drag={!isMobile}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            className="
              flex flex-col h-full w-full p-4 pointer-events-auto 
              bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 
              shadow-lg
              
              /* Desktop */
              rounded-xl border border-border/40
              
              /* Mobile Portrait */
              max-md:rounded-t-2xl max-md:rounded-b-none max-md:border-t max-md:border-x-0 max-md:border-b-0
              
              /* Mobile Landscape */
              max-lg:landscape:rounded-l-2xl max-lg:landscape:rounded-r-none max-lg:landscape:border-l max-lg:landscape:border-y-0 max-lg:landscape:border-r-0
            "
          >
            <div className="hidden max-md:portrait:block w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto -mt-1 mb-2" />
              <div className="flex flex-col space-y-2 mb-4">
                <div 
                  className={`flex items-center justify-between pb-1 ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}`}
                  onPointerDown={(e) => !isMobile && dragControls.start(e)}
                >
                  <div className="flex items-center gap-2">
                    {!isMobile && <GripHorizontal className="h-5 w-5 text-muted-foreground" />}
                    <div className="flex flex-col">
                      <h2 className="text-xl font-bold select-none">Vote</h2>
                      <p className="text-sm text-muted-foreground">{selectedContest.title} - {selectedContest.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => setSelectedContest(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">


              {isPrivate && !selectedContest.candidates.some(c => c.userId === userId) && (
                <button
                  onClick={() => handleJoin(selectedContest.id)}
                  disabled={isJoining}
                  className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {isJoining ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <UserPlus className="h-5 w-5" />
                  )}
                  Join as Candidate
                </button>
              )}

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {selectedContest.candidates.map((candidate) => {
                  const percentage = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0
                  const hasVoted = votedContestIds.has(selectedContest.id)

                  return (
                    <div key={candidate.userId} className="group relative flex flex-col gap-2 rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3"> 
                        {candidate.avatar ? (
                          <img src={candidate.avatar} className="object-cover h-10 w-10 rounded-full border border-white/20" alt="" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                          <span className="font-semibold text-lg">{candidate.username}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={() => handlePreview(candidate.userId)}>
                              {t('vote.preview')}
                            </Button>
                          {!hasVoted && (
                            <Button onClick={() => handleVote(selectedContest.id, candidate.userId)}>
                              {t('vote.vote')}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {hasVoted && (
                        <div className="mt-2 space-y-1">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div 
                              className="h-full bg-primary transition-all duration-1000" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                            <span>{candidate.votes} votes</span>
                            <span>{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
            
          </motion.div>
        </div>
      )}
      <VotePreview 
        userId={previewUserId} 
        onClose={() => setPreviewUserId(null)}
        canVote={selectedContest ? !votedContestIds.has(selectedContest.id) : false}
        onVote={() => {
          if (selectedContest && previewUserId) {
            handleVote(selectedContest.id, previewUserId)
          }
        }}
        isVoting={isVoting}
      />
      </>
  )
}