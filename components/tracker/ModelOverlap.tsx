'use client'

import { useState, useEffect } from 'react'
import { Loader2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

type ModelTool = { name: string; slug: string; cost: number; strength: number }
type Model = { name: string; provider: string; tools: ModelTool[]; useCases: string[] }
type Overlap = { model: string; tools: ModelTool[]; potential_savings: number }
type Coverage = {
  coding: number; writing: number; research: number; image_generation: number
  audio: number; video: number; design: number; chat: number
}
type OverlapData = { models: Model[]; overlaps: Overlap[]; coverage: Coverage }

const USE_CASE_LABELS: Record<string, string> = {
  coding: 'Code', writing: 'Writing', research: 'Research', image_generation: 'Images',
  audio: 'Audio', video: 'Video', design: 'Design', chat: 'Chat',
}

const DISPLAY_USE_CASES = ['coding', 'writing', 'research', 'image_generation', 'audio', 'chat'] as const

type AnonTool = { tool_id: string; monthly_cost: number }

export function ModelOverlap({ anonTools }: { anonTools?: AnonTool[] } = {}) {
  const [data, setData] = useState<OverlapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const opts = anonTools && anonTools.length > 0
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tools: anonTools }) }
      : {}
    fetch('/api/tracker/model-overlap', opts)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((d: OverlapData) => { setData(d); setLoading(false) })
      .catch(() => {
        toast.error('Could not load model intelligence')
        setLoading(false)
      })
  }, [anonTools])

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5 flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">Loading model intelligence…</span>
      </div>
    )
  }

  if (!data || data.models.length === 0) return null

  // Group models by provider for the collapsed list
  const byProvider: Record<string, Model[]> = {}
  for (const model of data.models) {
    if (!byProvider[model.provider]) byProvider[model.provider] = []
    byProvider[model.provider].push(model)
  }

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <h2 className="text-base font-black tracking-tight">Model Intelligence</h2>

      {/* Use-case coverage bar */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Use-case coverage</p>
        <div className="flex gap-1.5 flex-wrap">
          {DISPLAY_USE_CASES.map(uc => {
            const covered = (data.coverage[uc] ?? 0) >= 100
            return (
              <span
                key={uc}
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  covered
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-foreground/5 border-foreground/10 text-muted-foreground'
                }`}
              >
                {USE_CASE_LABELS[uc]}
              </span>
            )
          })}
        </div>
      </div>

      {/* Overlap warnings */}
      {data.overlaps.length > 0 && (
        <div className="space-y-2">
          {data.overlaps.map(overlap => (
            <div
              key={overlap.model}
              className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-foreground/80">
                  You access <span className="font-semibold">{overlap.model}</span> through{' '}
                  {overlap.tools.length} tools —{' '}
                  <span className="text-muted-foreground">you might only need one</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {overlap.tools.map(t => t.name).join(', ')}
                  {overlap.potential_savings > 0 && (
                    <span className="text-amber-400 ml-1">· up to ${overlap.potential_savings.toFixed(0)}/mo redundant</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsible model list grouped by provider */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {expanded ? 'Hide' : 'Show'} all models ({data.models.length})
      </button>

      {expanded && (
        <div className="space-y-3 pt-1">
          {Object.entries(byProvider).map(([provider, models]) => (
            <div key={provider}>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">{provider}</p>
              <div className="space-y-1">
                {models.map(model => (
                  <div key={model.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-foreground/80">{model.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {model.tools.length >= 2 && (
                        <span className="text-amber-400 text-[10px]">{model.tools.length}×</span>
                      )}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const strength = model.tools.reduce((max, t) => Math.max(max, t.strength), 0)
                          return (
                            <div
                              key={i}
                              className={`h-1.5 w-1 rounded-sm ${i < strength ? 'bg-emerald-500' : 'bg-foreground/10'}`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
