'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Newspaper, Zap, DollarSign, Puzzle, Gift, Star } from 'lucide-react'

type ChangelogEntry = {
  id: string
  tool_id: string
  event_type: string
  title: string
  summary: string
  source_url: string
  created_at: string
  tools: { name: string; slug: string; logo_url: string | null } | null
}

const EVENT_ICONS: Record<string, typeof Zap> = {
  feature: Zap,
  model: Star,
  price: DollarSign,
  integration: Puzzle,
  free_tier: Gift,
}

const EVENT_COLORS: Record<string, string> = {
  feature: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  model: 'text-violet-500 bg-violet-50 dark:bg-violet-950/30',
  price: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
  integration: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  free_tier: 'text-primary bg-primary/5',
}

export function ChangelogFeed({ anonTools }: { anonTools?: { tool_id: string }[] } = {}) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = anonTools && anonTools.length > 0
      ? `/api/tracker/changelog?tool_ids=${anonTools.map(t => t.tool_id).join(',')}`
      : '/api/tracker/changelog'
    fetch(url)
      .then(r => r.ok ? r.json() : { entries: [] })
      .then(d => { setEntries(d.entries || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [anonTools])

  if (loading || entries.length === 0) return null

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What changed in your stack</span>
      </div>
      <div className="space-y-2">
        {entries.slice(0, 5).map(entry => {
          const Icon = EVENT_ICONS[entry.event_type] || Zap
          const color = EVENT_COLORS[entry.event_type] || 'text-muted-foreground bg-muted'
          return (
            <a
              key={entry.id}
              href={entry.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-foreground/[0.02] transition-colors group"
            >
              <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    {entry.tools?.name || 'Unknown'}
                  </span>
                  <span className="text-[9px] text-muted-foreground/50">
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs font-semibold group-hover:text-primary transition-colors truncate">{entry.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{entry.summary}</p>
              </div>
            </a>
          )
        })}
      </div>
      {entries.length > 5 && (
        <p className="text-[10px] text-muted-foreground text-center mt-2">+{entries.length - 5} more updates</p>
      )}
    </div>
  )
}
