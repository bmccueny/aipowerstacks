'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'

type TrackedTool = {
  tool_id: string
  name: string
  logo_url: string | null
  cost: number
}

type CheckinData = {
  tool_id: string
  week_start: string
  used: boolean
}

export function UsageCheckin({ tools }: { tools: TrackedTool[] }) {
  const [checkins, setCheckins] = useState<CheckinData[]>([])
  const [responses, setResponses] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tracker/checkin')
      .then(r => r.json())
      .then(d => {
        setCheckins(d.checkins || [])
        // Check if already submitted this week
        const now = new Date()
        const day = now.getDay()
        const diff = day === 0 ? 6 : day - 1
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - diff)
        const weekStr = weekStart.toISOString().split('T')[0]
        const thisWeek = (d.checkins || []).filter((c: CheckinData) => c.week_start === weekStr)
        if (thisWeek.length > 0) setSubmitted(true)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggle = (toolId: string) => {
    setResponses(prev => ({ ...prev, [toolId]: !prev[toolId] }))
  }

  const submit = async () => {
    const data = tools.map(t => ({ tool_id: t.tool_id, used: responses[t.tool_id] || false }))
    const res = await fetch('/api/tracker/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses: data }),
    })
    if (res.ok) {
      setSubmitted(true)
      toast.success('Check-in saved!')
    }
  }

  // Compute usage stats from history
  const usageRates = new Map<string, { used: number; total: number }>()
  for (const c of checkins) {
    const existing = usageRates.get(c.tool_id) || { used: 0, total: 0 }
    existing.total++
    if (c.used) existing.used++
    usageRates.set(c.tool_id, existing)
  }

  if (loading || tools.length < 2) return null

  // If already submitted this week, show usage stats instead
  if (submitted && checkins.length > 0) {
    const zombies = tools.filter(t => {
      const rate = usageRates.get(t.tool_id)
      return rate && rate.total >= 3 && (rate.used / rate.total) < 0.25 && t.cost > 0
    })

    if (zombies.length === 0 && checkins.length < 8) return null

    return (
      <div className="rounded-xl border border-foreground/[0.06] p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Usage Insights</p>
        {zombies.length > 0 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 mb-3">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Zombie subscriptions detected</p>
            <p className="text-xs text-amber-600 dark:text-amber-400/80">
              {zombies.map(z => z.name).join(', ')} — paying ${zombies.reduce((s, z) => s + z.cost, 0)}/mo but barely using {zombies.length === 1 ? 'it' : 'them'}.
            </p>
          </div>
        )}
        <div className="space-y-1.5">
          {tools.map(t => {
            const rate = usageRates.get(t.tool_id)
            const pct = rate && rate.total > 0 ? Math.round((rate.used / rate.total) * 100) : null
            return (
              <div key={t.tool_id} className="flex items-center gap-2 text-xs">
                <span className="font-medium flex-1 truncate">{t.name}</span>
                {pct !== null ? (
                  <span className={`font-bold ${pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'}`}>
                    {pct}% used
                  </span>
                ) : (
                  <span className="text-muted-foreground">No data</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Show check-in prompt
  return (
    <div className="rounded-xl border border-primary/15 bg-primary/[0.02] p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Weekly Check-In</p>
      <p className="text-xs text-muted-foreground mb-3">Which tools did you actually use this week?</p>
      <div className="space-y-2 mb-3">
        {tools.map(t => (
          <button
            key={t.tool_id}
            onClick={() => toggle(t.tool_id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left ${
              responses[t.tool_id]
                ? 'border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/30'
                : 'border-foreground/[0.06] hover:border-foreground/10'
            }`}
          >
            <div className={`h-5 w-5 rounded flex items-center justify-center shrink-0 ${
              responses[t.tool_id] ? 'bg-emerald-500 text-white' : 'border border-foreground/15'
            }`}>
              {responses[t.tool_id] ? <Check className="h-3 w-3" /> : null}
            </div>
            <span className="text-sm font-medium flex-1 truncate">{t.name}</span>
            <span className="text-xs text-muted-foreground">${t.cost}/mo</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
        >
          Submit Check-In
        </button>
        <button
          onClick={() => setSubmitted(true)}
          className="h-9 px-3 rounded-lg border border-foreground/10 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
