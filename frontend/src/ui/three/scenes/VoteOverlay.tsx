import { useState, useMemo } from 'react'
import { Html } from '@react-three/drei'
import { X, User, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { api } from '@/lib/api'

interface Candidate {
  userId: string
  username: string
  avatar: string | null
  votes: number
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
}

export const VoteOverlay = ({ contests, onUpdateContests }: VoteOverlayProps) => {
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null)
  const [votedContestIds, setVotedContestIds] = useState<Set<string>>(new Set())
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (contestId: string, targetUserId: string) => {
    if (isVoting) return
    setIsVoting(true)
    try {
      await api.post(`/vote/${contestId}/vote`, { userId: targetUserId })
      
      // Optimistically update the UI/Refresh state
      setVotedContestIds((prev) => new Set(prev).add(contestId))
      toast.success(i18n.t('world.voteSuccess', { defaultValue: 'Vote cast successfully!' }))
      
      // Logic to increment local vote count for immediate feedback
      const updated = contests.map(c => {
        if (c.id === contestId) {
          return {
            ...c,
            candidates: c.candidates.map(can => 
              can.userId === targetUserId ? { ...can, votes: can.votes + 1 } : can
            )
          }
        }
        return c
      })
      onUpdateContests(updated)
      if (selectedContest?.id === contestId) {
        setSelectedContest(updated.find(u => u.id === contestId) || null)
      }
    } catch (err) {
      toast.error(i18n.t('world.voteError', { defaultValue: 'Failed to cast vote' }))
    } finally {
      setIsVoting(false)
    }
  }

  const totalVotes = useMemo(() => {
    if (!selectedContest) return 0
    return selectedContest.candidates.reduce((sum, c) => sum + c.votes, 0)
  }, [selectedContest])

  if (contests.length === 0) return null

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div className="absolute left-6 top-24 z-10 w-64 pointer-events-auto">
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <button 
              onClick={() => setSelectedContest(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="text-xl font-bold mb-1">{selectedContest.title}</h2>
            <p className="text-sm text-muted-foreground mb-6">{selectedContest.description}</p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {selectedContest.candidates.map((candidate) => {
                const percentage = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0
                const hasVoted = votedContestIds.has(selectedContest.id)

                return (
                  <div key={candidate.userId} className="group relative flex flex-col gap-2 rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10">
                    <div className="flex items-center gap-3">
                      {candidate.avatar ? (
                        <img src={candidate.avatar} className="h-10 w-10 rounded-full border border-white/20" alt="" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                      <span className="font-semibold text-lg">{candidate.username}</span>
                      
                      {!hasVoted && (
                        <button
                          onClick={() => handleVote(selectedContest.id, candidate.userId)}
                          className="ml-auto rounded-full bg-primary px-4 py-1 text-sm font-bold text-primary-foreground transition-transform active:scale-95"
                        >
                          Vote
                        </button>
                      )}
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
          </div>
        </div>
      )}
    </Html>
  )
}