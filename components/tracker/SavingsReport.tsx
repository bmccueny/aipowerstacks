'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, TrendingDown, AlertTriangle, ArrowRight, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react'

type OverlapTool = { name: string; slug: string; logo_url: string | null; cost: number; rating: number; reviews: number }
type Overlap = { label: string; tools: OverlapTool[]; totalCost: number; savingsIfKeepOne: number }
type PremiumOverlapTool = { name: string; slug: string; cost: number; cheapestTier: string; cheapestCost: number }
type PremiumOverlap = { label: string; tools: PremiumOverlapTool[]; totalCost: number; savingsIfDowngradeRest: number }

type Report = {
  totalMonthly: number
  totalYearly: number
  toolCount: number
  overlaps: Overlap[]
  premiumOverlaps: PremiumOverlap[]
  benchmark: { avgMonthly: number; percentile: number }
  totalPotentialSavings: number
  verdict: string
}

const COMPARISONS = [
  { threshold: 100, text: 'a gym membership' },
  { threshold: 200, text: 'a car payment' },
  { threshold: 500, text: 'a vacation flight' },
  { threshold: 1000, text: 'a new iPhone' },
  { threshold: 2000, text: 'a MacBook Air' },
  { threshold: 3000, text: 'a month of rent' },
]

export function SavingsReport() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    fetch('/api/tracker/report')
      .then(r => r.json())
      .then(d => { setReport(d.report || null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-foreground/[0.06] p-8 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Generating your savings report...</p>
      </div>
    )
  }

  if (!report || report.toolCount === 0) return null

  const savingsComparison = COMPARISONS.filter(c => report.totalPotentialSavings >= c.threshold).pop()

  return (
    <div className="space-y-4">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-sm font-bold flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-emerald-500" />
          Your Savings Report
        </h3>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* Verdict card */}
          <div className={`rounded-xl p-5 text-center border ${
            report.totalPotentialSavings > 0
              ? 'border-emerald-400/20 bg-emerald-400/[0.04]'
              : 'border-foreground/[0.06] bg-foreground/[0.02]'
          }`}>
            {report.totalPotentialSavings > 0 ? (
              <>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  ${report.totalPotentialSavings}/yr
                </p>
                <p className="text-sm text-muted-foreground mt-1">potential savings found</p>
                {savingsComparison && (
                  <p className="text-xs text-muted-foreground mt-2">
                    That&apos;s more than {savingsComparison.text}.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xl font-black">No waste detected</p>
                <p className="text-sm text-muted-foreground mt-1">Your stack looks lean.</p>
              </>
            )}
          </div>

          {/* Spend summary */}
          <div className="rounded-xl border border-foreground/[0.06] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your spend</span>
              <span className="text-sm font-bold">${report.totalMonthly}/mo · ${report.totalYearly}/yr</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">vs average user</span>
              <span className="text-xs">
                {report.benchmark.percentile >= 70
                  ? <span className="text-amber-500 font-semibold">Top {100 - report.benchmark.percentile}% spender (avg ${report.benchmark.avgMonthly}/mo)</span>
                  : report.benchmark.percentile <= 30
                    ? <span className="text-emerald-500 font-semibold">Below average — you&apos;re lean</span>
                    : <span className="text-muted-foreground">Average range (${report.benchmark.avgMonthly}/mo avg)</span>
                }
              </span>
            </div>
          </div>

          {/* Overlap groups */}
          {report.overlaps.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Overlapping tools
              </h4>
              {report.overlaps.map((overlap, i) => (
                <div key={i} className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold">{overlap.label}</p>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Save ${overlap.savingsIfKeepOne}/yr
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    These tools do the same thing. Keep your favorite, drop the rest.
                  </p>
                  <div className="space-y-2 mb-3">
                    {overlap.tools.map((tool, j) => (
                      <div key={j} className="flex items-center gap-3 bg-background/50 rounded-lg px-3 py-2">
                        <div className="h-7 w-7 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                          {tool.logo_url ? (
                            <img src={tool.logo_url} alt="" className="w-7 h-7 object-contain" />
                          ) : (
                            <span className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{tool.name[0]}</span>
                          )}
                        </div>
                        <span className="text-sm font-medium flex-1">{tool.name}</span>
                        {tool.rating > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ★ {tool.rating.toFixed(1)} ({tool.reviews})
                          </span>
                        )}
                        <span className="text-sm font-bold">${tool.cost}/mo</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/compare?tools=${overlap.tools.map(t => t.slug).join(',')}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    Compare side-by-side to decide <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Premium overlap — paying top-tier on multiple competing tools */}
          {report.premiumOverlaps.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ArrowDown className="h-3.5 w-3.5 text-blue-500" />
                Premium tier overlap
              </h4>
              {report.premiumOverlaps.map((po, i) => (
                <div key={i} className="rounded-xl border border-blue-400/20 bg-blue-400/[0.03] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold">{po.label}</p>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Save ${po.savingsIfDowngradeRest}/yr
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    You&apos;re paying premium on {po.tools.length} {po.label.toLowerCase()} tools (${po.totalCost}/mo total). Pick your favorite at the top tier — downgrade or drop the rest.
                  </p>
                  <div className="space-y-2 mb-3">
                    {po.tools.map((tool, j) => (
                      <div key={j} className="flex items-center gap-3 bg-background/50 rounded-lg px-3 py-2">
                        <span className="text-sm font-medium flex-1">{tool.name}</span>
                        <span className="text-xs text-muted-foreground">{tool.cheapestTier} is ${tool.cheapestCost}/mo</span>
                        <span className="text-sm font-bold">${tool.cost}/mo</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/compare?tools=${po.tools.map(t => t.slug).join(',')}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    Compare to decide which stays at Pro <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Verdict */}
          <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-4 text-center">
            <p className="text-sm text-muted-foreground">{report.verdict}</p>
          </div>
        </div>
      )}
    </div>
  )
}
