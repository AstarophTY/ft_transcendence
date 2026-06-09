import React, { useEffect, useState } from 'react'
import { useAdmin } from '@/store/admin'
import { Plus, Trophy, Calendar, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  campusId: string
}

export const CampusContestManager: React.FC<Props> = ({ campusId }) => {
  const { contests, loadContests, createContest, toggleContest } = useAdmin()
  const campusContests = contests[campusId] || []
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: ''
  })

  useEffect(() => {
    loadContests(campusId)
  }, [campusId, loadContests])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.startsAt || !formData.endsAt) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      await createContest(campusId, formData)
      setIsAdding(false)
      setFormData({ title: '', description: '', startsAt: '', endsAt: '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 space-y-4 border-t border-white/5 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Campus Contests
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <Plus className="h-4 w-4" />
          {isAdding ? 'Cancel' : 'New Contest'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Best Campus Architect"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary h-20 resize-none"
              placeholder="What is this contest about?"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Starts At *</label>
              <input
                type="datetime-local"
                required
                value={formData.startsAt}
                onChange={e => setFormData({ ...formData, startsAt: e.target.value })}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ends At *</label>
              <input
                type="datetime-local"
                required
                value={formData.endsAt}
                onChange={e => setFormData({ ...formData, endsAt: e.target.value })}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary py-2.5 rounded-lg text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Contest
          </button>
        </form>
      )}

      <div className="grid gap-2">
        {campusContests.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">No contests created yet for this campus.</p>
        ) : (
          campusContests.map(contest => (
            <div key={contest.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 transition-colors hover:bg-white/[0.07]">
              <div className="space-y-1">
                <p className="font-bold text-sm leading-tight">{contest.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(contest.startsAt).toLocaleString()}</span>
                  <span className="opacity-50">→</span>
                  <span>{new Date(contest.endsAt).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => toggleContest(campusId, contest.id, !contest.isActive)}
                className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
                  contest.isActive 
                    ? 'bg-primary/20 text-primary border border-primary/20' 
                    : 'bg-white/5 text-muted-foreground border border-white/5 opacity-50'
                }`}
              >
                {contest.isActive ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                {contest.isActive ? 'Active' : 'Draft'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}