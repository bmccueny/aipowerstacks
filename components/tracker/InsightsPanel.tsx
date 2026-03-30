'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Insight = {
  type: 'price_increase' | 'price_decrease' | 'new_alternative'
  message: string
  severity: 'info' | 'warning' | 'critical'
  toolSlug?: string
}

type ToolSub = {
  tool_id: string
  tools: { name: string; slug: string } | null
}

function severityColor(severity: string, type: string): string {
  if (type === 'price_increase') return 'border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400'
  if (type === 'price_decrease') return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
  if (type === 'new_alternative') return 'border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-400'
  return 'border-foreground/10 bg-muted/50'
}

function InsightIcon({ type }: { type: string }) {
  if (type === 'price_increase') return <TrendingUp className="h-4 w-4 shrink-0" />
  if (type === 'price_decrease') return <TrendingDown className="h-4 w-4 shrink-0" />
  return <Sparkles className="h-4 w-4 shrink-0" />
}

export function InsightsPanel({ subscriptions }: { subscriptions: ToolSub[] }) {
  const [insights, setInsights] = useState<(Insight & { toolName: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (subscriptions.length === 0) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    let cancelled = false

    async function fetchAll() {
      const results: (Insight & { toolName: string })[] = []

      // Fetch insights for all tools in parallel (max 10 concurrent)
      const batches: ToolSub[][] = []
      for (let i = 0; i < subscriptions.length; i += 10) {
        batches.push(subscriptions.slice(i, i + 10))
      }

      for (const batch of batches) {
        if (cancelled) break
        const promises = batch.map(async (sub) => {
          try {
            const res = await fetch(`/api/tracker/insights?tool_id=${sub.tool_id}`, {
              signal: controller.signal,
            })
            if (!res.ok) return []
            const data = await res.json()
            return (data.insights || []).map((ins: Insight) => ({
              ...ins,
              toolName: sub.tools?.name || 'Unknown',
            }))
          } catch {
            return []
          }
        })
        const batchResults = await Promise.all(promises)
        results.push(...batchResults.flat())
      }

      if (!cancelled) {
        // Sort: critical first, then warning, then info
        const order = { critical: 0, warning: 1, info: 2 }
        results.sort((a, b) => (order[a.severity] ?? 2) - (order[b.severity] ?? 2))
        setInsights(results)
        setLoading(false)
      }
    }

    fetchAll()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [subscriptions])

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking for insights…
        </div>
      </div>
    )
  }

  if (insights.length === 0) return null

  const criticalCount = insights.filter(i => i.severity === 'critical').length
  const warningCount = insights.filter(i => i.severity === 'warning').length

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            Stack Insights
          </span>
          <span className="text-xs text-muted-foreground">
            {insights.length} alert{insights.length !== 1 ? 's' : ''}
          </span>
          {criticalCount > 0 && (
            <span className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full font-medium">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {insights.map((insight, i) => (
            <div
              key={`${insight.type}-${insight.toolName}-${i}`}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${severityColor(insight.severity, insight.type)}`}
            >
              <InsightIcon type={insight.type} />
              <div className="flex-1 min-w-0">
                <p className="leading-snug">{insight.message}</p>
              </div>
              {insight.toolSlug && (
                <Link
                  href={`/tools/${insight.toolSlug}`}
                  className="text-xs font-medium underline underline-offset-2 shrink-0 hover:opacity-80"
                >
                  View
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
