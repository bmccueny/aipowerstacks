'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingDown, AlertTriangle, ArrowRight, ArrowDown, ChevronDown, ChevronUp, Download, Share2, Sparkles, Zap, Shield } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type OverlapTool = {
  name: string; slug: string; logo_url: string | null; cost: number
  rating: number; reviews: number; score: number
  unique_value?: string; verdict?: 'keep' | 'consider_dropping' | 'downgrade'
}
type Overlap = {
  label: string; tools: OverlapTool[]; topPick: string; topPickSlug: string
  totalCost: number; savingsIfKeepBest: number
  confidence?: number; shared_capabilities?: string[]; savings_reasoning?: string
}
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
  aiPowered?: boolean
  stackEfficiency?: number | null
}

const COMPARISONS = [
  { threshold: 100, text: 'a gym membership' },
  { threshold: 200, text: 'a car payment' },
  { threshold: 500, text: 'a vacation flight' },
  { threshold: 1000, text: 'a new iPhone' },
  { threshold: 2000, text: 'a MacBook Air' },
  { threshold: 3000, text: 'a month of rent' },
]

function confidenceColor(c: number): string {
  if (c >= 85) return 'bg-red-500'
  if (c >= 70) return 'bg-amber-500'
  return 'bg-blue-500'
}

function confidenceLabel(c: number): string {
  if (c >= 85) return 'High overlap'
  if (c >= 70) return 'Moderate overlap'
  return 'Partial overlap'
}

type SavingsData = Partial<Report> & { analysis?: string }

export function SavingsReport({ data }: { data: SavingsData | null }) {
  const [expanded, setExpanded] = useState(true)

  const report: Report | null = data ? {
    totalMonthly: data.totalMonthly ?? 0,
    totalYearly: data.totalYearly ?? 0,
    toolCount: data.toolCount ?? 0,
    overlaps: data.overlaps ?? [],
    premiumOverlaps: data.premiumOverlaps ?? [],
    benchmark: data.benchmark ?? { avgMonthly: 0, percentile: 0 },
    totalPotentialSavings: data.totalPotentialSavings ?? 0,
    missingUseCases: data.missingUseCases ?? [],
    verdict: data.verdict ?? '',
    aiPowered: data.aiPowered ?? false,
    stackEfficiency: data.stackEfficiency ?? null,
  } : null

  const analysis = data?.analysis ?? null

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
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'ai-spend-report.png'
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Report card downloaded')
      }
    } catch {
      toast.error('Could not generate report card')
    }
  }

  if (!report || report.toolCount === 0) return null

  const savingsComparison = COMPARISONS.filter(c => report.totalPotentialSavings >= c.threshold).pop()

  return (
    <div className="space-y-4">
      {/* Stack Analysis */}
      {analysis && (
        <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Stack Analysis</span>
          </div>
          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {analysis}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
          <h3 className="text-base font-bold flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-emerald-500" />
            Savings Report
            {report.aiPowered && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Zap className="h-2.5 w-2.5" />AI
              </span>
            )}
            {!expanded && report.totalPotentialSavings > 0 && (
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">${report.totalPotentialSavings}/yr</span>
            )}
          </h3>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {expanded && (
          <div className="flex items-center gap-1.5">
            <button onClick={shareReportCard} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors" title="Share report card">
              <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={downloadReport} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors" title="Download report">
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="space-y-4">
          {/* Verdict card */}
          <div className={cn(
            'rounded-xl p-5 text-center border',
            report.totalPotentialSavings > 0
              ? 'border-emerald-400/20 bg-emerald-400/[0.04]'
              : 'border-border bg-muted/30'
          )}>
            {report.totalPotentialSavings > 0 ? (
              <>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
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
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  <p className="text-xl font-bold">No waste detected</p>
                </div>
                <p className="text-sm text-muted-foreground">Your stack looks lean.</p>
              </>
            )}

            {report.stackEfficiency != null && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Stack efficiency</span>
                  <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        report.stackEfficiency >= 8 ? 'bg-emerald-500' :
                        report.stackEfficiency >= 6 ? 'bg-blue-500' :
                        report.stackEfficiency >= 4 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      style={{ width: `${report.stackEfficiency * 10}%` }}
                    />
                  </div>
                  <span className={cn(
                    'text-xs font-bold',
                    report.stackEfficiency >= 8 ? 'text-emerald-500' :
                    report.stackEfficiency >= 6 ? 'text-blue-500' :
                    report.stackEfficiency >= 4 ? 'text-amber-500' : 'text-red-500'
                  )}>
                    {report.stackEfficiency}/10
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Benchmark */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                <strong className="text-foreground">${report.totalMonthly}/mo</strong>
                <span className="text-muted-foreground"> · ${report.totalYearly}/yr</span>
              </span>
              <span className="text-xs">
                {report.benchmark.percentile >= 70
                  ? <span className="text-amber-500 font-semibold">Top {100 - report.benchmark.percentile}% spender</span>
                  : report.benchmark.percentile <= 30
                    ? <span className="text-emerald-500 font-semibold">Below average</span>
                    : <span className="text-muted-foreground">Average range</span>
                }
              </span>
            </div>
          </div>

          {/* Overlap groups — enhanced with AI insights */}
          {report.overlaps.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Capability overlaps detected
              </h4>
              {report.overlaps.map((overlap, i) => (
                <div key={i} className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4 space-y-3">
                  {/* Header with confidence */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{overlap.label}</p>
                      {overlap.confidence != null && (
                        <span className="flex items-center gap-1.5">
                          <div className="h-1.5 w-10 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${confidenceColor(overlap.confidence)}`} style={{ width: `${overlap.confidence}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{confidenceLabel(overlap.confidence)}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Save ${overlap.savingsIfKeepBest}/yr
                    </span>
                  </div>

                  {/* Shared capabilities */}
                  {overlap.shared_capabilities && overlap.shared_capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {overlap.shared_capabilities.map((cap, j) => (
                        <span key={j} className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Savings reasoning */}
                  {overlap.savings_reasoning && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {overlap.savings_reasoning}
                    </p>
                  )}

                  {/* Tool list with unique value */}
                  <div className="space-y-1.5">
                    {overlap.tools.map((tool, j) => {
                      const isKeep = tool.verdict === 'keep' || j === 0
                      return (
                        <div key={j} className={cn(
                          'flex items-start gap-3 rounded-lg px-3 py-2.5',
                          isKeep ? 'bg-emerald-400/[0.06] border border-emerald-400/15' : 'bg-background/50'
                        )}>
                          <div className="h-7 w-7 rounded-md overflow-hidden flex items-center justify-center shrink-0 mt-0.5">
                            {tool.logo_url ? (
                              <Image src={tool.logo_url} alt={tool.name} width={28} height={28} className="w-7 h-7 object-contain" unoptimized />
                            ) : (
                              <span className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{tool.name[0]}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium">{tool.name}</span>
                              {isKeep && (
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Keep</span>
                              )}
                              {tool.verdict === 'consider_dropping' && (
                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Consider dropping</span>
                              )}
                            </div>
                            {tool.unique_value && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                {isKeep ? '✓' : '→'} {tool.unique_value}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {tool.rating > 0 && (
                              <span className={cn('text-[10px] block', isKeep ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground')}>
                                ★ {tool.rating.toFixed(1)} ({tool.reviews})
                              </span>
                            )}
                            <span className="text-sm font-bold">${tool.cost}/mo</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <Link
                    href={`/compare?tools=${overlap.tools.map(t => t.slug).join(',')}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    Compare features side-by-side <ArrowRight className="h-3 w-3" />
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
                    You&apos;re paying premium on {po.tools.length} {po.label.toLowerCase()} tools (${po.totalCost}/mo total). Pick one to stay premium, downgrade the rest.
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
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">{report.verdict}</p>
          </div>
        </div>
      )}
    </div>
  )
}
