'use client'

import { TrendingDown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Overlap = {
  useCase: string
  label: string
  tools: { tool_id: string; monthly_cost: number }[]
  totalCost: number
}

type TrackerCostSummaryProps = {
  total: number
  yearly: number
  effectiveCount: number
  overlaps: Overlap[]
  overlapSavings: number
  clientLoggedIn: boolean
  importing: boolean
}

export function TrackerCostSummary({
  total,
  yearly,
  effectiveCount,
  overlaps,
  overlapSavings,
  clientLoggedIn,
  importing,
}: TrackerCostSummaryProps) {
  return (
    <>
      {/* Import loading */}
      {importing && (
        <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-6 text-center flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-bold">Importing your tools...</p>
        </div>
      )}

      {/* Cost summary — hero layout */}
      {effectiveCount > 0 && (
        <div className="rounded-xl bg-foreground/[0.02] border border-foreground/[0.06] px-6 py-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-4xl sm:text-5xl font-black">${total.toFixed(0)}<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
            <p className="text-sm text-muted-foreground">${yearly.toFixed(0)}/yr · {effectiveCount} tool{effectiveCount !== 1 ? 's' : ''}{overlaps.length > 0 ? ` · ${overlaps.length} overlap${overlaps.length > 1 ? 's' : ''}` : ''}</p>
          </div>
          {overlapSavings > 0 && (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.08] px-5 py-3 text-center shrink-0">
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">${(overlapSavings * 12).toFixed(0)}/yr</p>
              <p className="text-[10px] text-muted-foreground">potential savings</p>
            </div>
          )}
        </div>
      )}

      {/* Optimizer banner — surface early when savings detected */}
      {overlapSavings > 0 && effectiveCount >= 3 && clientLoggedIn && (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.04] to-emerald-500/[0.04] p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingDown className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">We found <span className="text-emerald-600 dark:text-emerald-400">${(overlapSavings * 12).toFixed(0)}/yr</span> in potential savings</p>
            <p className="text-xs text-muted-foreground">Let AI build your optimized stack</p>
          </div>
          <a href="#stack-optimizer" className="shrink-0">
            <Button size="sm" className="gap-1 text-xs font-bold">
              Optimize <ArrowRight className="h-3 w-3" />
            </Button>
          </a>
        </div>
      )}
    </>
  )
}
