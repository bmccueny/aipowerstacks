'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, TrendingDown, AlertTriangle, ArrowRight, ArrowDown, ChevronDown, ChevronUp, Download, Share2, Image as ImageIcon, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

type OverlapTool = { name: string; slug: string; logo_url: string | null; cost: number; rating: number; reviews: number; score: number }
type Overlap = { label: string; tools: OverlapTool[]; topPick: string; topPickSlug: string; totalCost: number; savingsIfKeepBest: number }
type PremiumOverlapTool = { name: string; slug: string; cost: number; cheapestTier: string; cheapestCost: number }
type PremiumOverlap = { label: string; tools: PremiumOverlapTool[]; totalCost: number; savingsIfDowngradeRest: number }
type MissingUseCase = { useCase: string; label: string; topTool: { name: string; slug: string; logo_url: string | null; avg_rating: number; review_count: number; cheapest_price: number } | null }

type Report = {
  totalMonthly: number
  totalYearly: number
  toolCount: number
  overlaps: Overlap[]
  premiumOverlaps: PremiumOverlap[]
  benchmark: { avgMonthly: number; percentile: number }
  totalPotentialSavings: number
  missingUseCases: MissingUseCase[]
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

const ROLE_BENCHMARKS: Record<string, number> = {
  developer: 120,
  marketer: 165,
  creator: 140,
  researcher: 95,
  founder: 180,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SavingsReport({ data }: { data: any }) {
  const [expanded, setExpanded] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  const report: Report | null = data ? {
    totalMonthly: data.totalMonthly,
    totalYearly: data.totalYearly,
    toolCount: data.toolCount,
    overlaps: data.overlaps,
    premiumOverlaps: data.premiumOverlaps,
    benchmark: data.benchmark,
    totalPotentialSavings: data.totalPotentialSavings,
    missingUseCases: data.missingUseCases,
    verdict: data.verdict,
  } : null

  const analysis = data?.analysis as string | null

  const downloadReport = () => {
    window.open('/api/tracker/export-pdf', '_blank')
    toast.success('Report downloaded')
  }

  const shareReportCard = async () => {
    try {
      const res = await fetch('/api/tracker/report-card')
      const blob = await res.blob()
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'ai-spend.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: 'My AI Spend Report',
          text: `I spend $${report?.totalMonthly}/mo on AI tools. How about you?`,
          files: [new File([blob], 'ai-spend.png', { type: 'image/png' })],
        })
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'ai-spend-report.png'
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Report card downloaded — share it on social!')
      }
    } catch {
      toast.error('Could not generate report card')
    }
  }

  if (!report || report.toolCount === 0) return null

  const savingsComparison = COMPARISONS.filter(c => report.totalPotentialSavings >= c.threshold).pop()
  const roleAvg = role ? ROLE_BENCHMARKS[role] : null

  return (
    <div className="space-y-4">
      {/* Header + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
          <h3 className="text-base font-bold flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-emerald-500" />
            Savings Report
            {!expanded && report.totalPotentialSavings > 0 && (
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">${report.totalPotentialSavings}/yr</span>
            )}
            {!expanded && report.totalPotentialSavings === 0 && (
              <span className="text-sm text-muted-foreground">No waste</span>
            )}
          </h3>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {expanded && (
          <div className="flex items-center gap-1.5">
            <button onClick={shareReportCard} className="h-8 w-8 rounded-lg border border-foreground/10 flex items-center justify-center hover:bg-muted/50 transition-colors" title="Share report card">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={downloadReport} className="h-8 w-8 rounded-lg border border-foreground/10 flex items-center justify-center hover:bg-muted/50 transition-colors" title="Download report">
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

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

          {/* Role selector + benchmark */}
          <div className="rounded-xl border border-foreground/[0.06] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your spend vs benchmark</span>
              <div className="flex gap-1">
                {Object.keys(ROLE_BENCHMARKS).map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(role === r ? null : r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      role === r ? 'bg-primary/10 text-primary border border-primary/30' : 'border border-foreground/[0.06] text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">
                <strong className="text-foreground">${report.totalMonthly}/mo</strong>
                <span className="text-muted-foreground"> · ${report.totalYearly}/yr</span>
              </span>
              <span className="text-xs">
                {roleAvg ? (
                  report.totalMonthly > roleAvg
                    ? <span className="text-amber-500 font-semibold">Above avg for {role}s (${roleAvg}/mo)</span>
                    : <span className="text-emerald-500 font-semibold">Below avg for {role}s (${roleAvg}/mo)</span>
                ) : (
                  report.benchmark.percentile >= 70
                    ? <span className="text-amber-500 font-semibold">Top {100 - report.benchmark.percentile}% spender</span>
                    : report.benchmark.percentile <= 30
                      ? <span className="text-emerald-500 font-semibold">Below average</span>
                      : <span className="text-muted-foreground">Average range</span>
                )}
              </span>
            </div>
          </div>

          {/* Stack Analysis */}
          {analysis && (
            <div className="rounded-xl border border-primary/15 bg-gradient-to-b from-primary/[0.03] to-transparent p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Stack Analysis</span>
              </div>
              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {analysis}
              </div>
            </div>
          )}

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
                      Save ${overlap.savingsIfKeepBest}/yr
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Based on ratings, <strong className="text-foreground">{overlap.topPick}</strong> is the strongest in this group. If you only need one {overlap.label.toLowerCase()} tool, the others are candidates to drop.
                  </p>
                  <div className="space-y-1.5 mb-3">
                    {overlap.tools.map((tool, j) => {
                      const isTopPick = j === 0
                      return (
                        <div key={j} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isTopPick ? 'bg-emerald-400/[0.06] border border-emerald-400/15' : 'bg-background/50'}`}>
                          <div className="h-7 w-7 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                            {tool.logo_url ? (
                              <img src={tool.logo_url} alt="" className="w-7 h-7 object-contain" />
                            ) : (
                              <span className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{tool.name[0]}</span>
                            )}
                          </div>
                          <span className="text-sm font-medium flex-1">
                            {tool.name}
                            {isTopPick && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ml-1.5">TOP RATED</span>}
                          </span>
                          {tool.rating > 0 && (
                            <span className={`text-xs ${isTopPick ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>
                              ★ {tool.rating.toFixed(1)} ({tool.reviews})
                            </span>
                          )}
                          <span className="text-sm font-bold">${tool.cost}/mo</span>
                        </div>
                      )
                    })}
                  </div>
                  <Link
                    href={`/compare?tools=${overlap.tools.map(t => t.slug).join(',')}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    Compare features to decide <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Premium overlap */}
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

          {/* What you're missing */}
          {report.missingUseCases && report.missingUseCases.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                You might also want
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {report.missingUseCases.slice(0, 4).map((mc, i) => (
                  mc.topTool && (
                    <Link
                      key={i}
                      href={`/tools/${mc.topTool.slug}`}
                      className="rounded-xl border border-foreground/[0.06] p-3 flex items-center gap-3 hover:border-primary/20 transition-all group"
                    >
                      <div className="h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                        {mc.topTool.logo_url ? (
                          <img src={mc.topTool.logo_url} alt="" className="w-9 h-9 object-contain" />
                        ) : (
                          <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{mc.topTool.name[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold group-hover:text-primary transition-colors truncate">{mc.topTool.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {mc.label} · ★ {mc.topTool.avg_rating.toFixed(1)} · {mc.topTool.cheapest_price > 0 ? `from $${mc.topTool.cheapest_price}/mo` : 'Free'}
                        </p>
                      </div>
                    </Link>
                  )
                ))}
              </div>
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
