'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus, Users, Activity, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

type BenchmarkData = {
  avgMonthly: number
  median: number
  p25: number
  p75: number
  p90: number
  userCount: number
  percentile: number
  userTotal: number
  isIndustryBenchmark: boolean
  categoryBreakdown: Array<{
    categoryId: string
    categoryName: string
    userSpend: number
    avgSpend: number
  }>
}

type ToolPulse = {
  toolId: string
  name: string
  slug: string
  logoUrl: string | null
  pulse: number
  label: string
  color: string
  avgRating: number
  reviewCount: number
  trackingCount: number
  signals: {
    rating: number
    popularity: number
    retention: number
  }
}

type SentimentData = {
  tools: ToolPulse[]
  stackPulse: number
  stackLabel: string
  stackColor: string
  toolCount: number
}

const PULSE_COLORS: Record<string, string> = {
  emerald: 'text-emerald-500 bg-emerald-500',
  blue: 'text-blue-500 bg-blue-500',
  amber: 'text-amber-500 bg-amber-500',
  red: 'text-red-500 bg-red-500',
}

// Dynamic bar color based on fill percentage (0-100)
// For spend bars: low=green (saving), mid=blue, high=amber, very high=red (overspending)
function spendBarColor(pct: number): string {
  if (pct <= 30) return 'bg-emerald-500'
  if (pct <= 60) return 'bg-blue-500'
  if (pct <= 80) return 'bg-amber-500'
  return 'bg-red-500'
}

// For pulse/quality bars: inverse — low=red (bad), mid=amber, high=blue, very high=green (great)
function pulseBarColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 60) return 'bg-blue-500'
  if (pct >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function pulseTextColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-500'
  if (pct >= 60) return 'text-blue-500'
  if (pct >= 40) return 'text-amber-500'
  return 'text-red-500'
}

function GaugeMeter({ percentile }: { percentile: number }) {
  const rotation = (percentile / 100) * 180 - 90
  const color =
    percentile <= 30 ? 'text-emerald-500' :
    percentile <= 60 ? 'text-blue-500' :
    percentile <= 80 ? 'text-amber-500' :
    'text-red-500'

  const label =
    percentile <= 20 ? 'Minimal Spender' :
    percentile <= 40 ? 'Budget-Conscious' :
    percentile <= 60 ? 'Average' :
    percentile <= 80 ? 'Power User' :
    'Top Spender'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-40 h-20 overflow-hidden">
        <div className="absolute inset-0 rounded-t-full border-[12px] border-b-0 border-muted" />
        <div className="absolute inset-0 rounded-t-full border-[12px] border-b-0 border-transparent"
          style={{
            borderTopColor: 'var(--gauge-color)',
            borderLeftColor: percentile > 25 ? 'var(--gauge-color)' : 'transparent',
            borderRightColor: percentile > 75 ? 'var(--gauge-color)' : 'transparent',
            // @ts-expect-error CSS custom property
            '--gauge-color': percentile <= 30 ? '#10b981' : percentile <= 60 ? '#3b82f6' : percentile <= 80 ? '#f59e0b' : '#ef4444',
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 origin-bottom h-16 w-0.5 bg-foreground transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full bg-foreground" />
      </div>
      <div className="text-center">
        <span className={`text-2xl font-bold ${color}`}>{percentile}th</span>
        <span className="text-sm text-muted-foreground ml-1">percentile</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function CategoryBar({ name, userSpend, avgSpend }: { name: string; userSpend: number; avgSpend: number }) {
  const maxSpend = Math.max(userSpend, avgSpend, 1)
  const userWidth = (userSpend / maxSpend) * 100
  const avgWidth = (avgSpend / maxSpend) * 100
  const diff = userSpend - avgSpend
  const diffPercent = avgSpend > 0 ? Math.round((diff / avgSpend) * 100) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium truncate">{name}</span>
        <span className="text-muted-foreground flex items-center gap-1">
          {diff > 0 ? (
            <><TrendingUp className="h-3 w-3 text-red-400" />+{diffPercent}%</>
          ) : diff < 0 ? (
            <><TrendingDown className="h-3 w-3 text-emerald-400" />{diffPercent}%</>
          ) : (
            <><Minus className="h-3 w-3" />same</>
          )}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-8">You</span>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${spendBarColor(userWidth)} transition-all duration-500`} style={{ width: `${userWidth}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground w-12 text-right">${userSpend}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-8">Avg</span>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-muted-foreground/30 transition-all duration-500" style={{ width: `${avgWidth}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground w-12 text-right">${avgSpend}</span>
        </div>
      </div>
    </div>
  )
}

function PulseBar({ tool }: { tool: ToolPulse }) {
  const isWeak = tool.pulse < 50

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="flex items-center gap-3 py-2 group"
    >
      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {tool.logoUrl ? (
          <img src={tool.logoUrl} alt={tool.name} width={28} height={28} className="rounded-lg object-contain" />
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground">{tool.name[0]}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium truncate group-hover:text-primary transition-colors">{tool.name}</span>
          {isWeak && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${pulseBarColor(tool.pulse)} transition-all duration-700`}
              style={{ width: `${tool.pulse}%` }}
            />
          </div>
          <span className={`text-[10px] font-bold ${pulseTextColor(tool.pulse)} w-6 text-right`}>{tool.pulse}</span>
        </div>
      </div>
    </Link>
  )
}

export function BenchmarkCard({ anonTools }: { anonTools?: { tool_id: string; monthly_cost: number }[] } = {}) {
  const [data, setData] = useState<BenchmarkData | null>(null)
  const [sentiment, setSentiment] = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let benchUrl = '/api/tracker/benchmark'
    let sentimentUrl = '/api/tracker/sentiment'
    if (anonTools && anonTools.length > 0) {
      const total = anonTools.reduce((sum, t) => sum + t.monthly_cost, 0)
      const ids = anonTools.map(t => t.tool_id).join(',')
      benchUrl = `/api/tracker/benchmark?tool_ids=${ids}&total=${total}`
      sentimentUrl = `/api/tracker/sentiment?tool_ids=${ids}`
    }

    Promise.allSettled([
      fetch(benchUrl).then(r => { if (!r.ok) throw new Error('Failed'); return r.json() }),
      fetch(sentimentUrl).then(r => { if (!r.ok) throw new Error('Failed'); return r.json() }),
    ]).then(([benchResult, sentimentResult]) => {
      if (benchResult.status === 'fulfilled') setData(benchResult.value)
      if (sentimentResult.status === 'fulfilled') setSentiment(sentimentResult.value)
      setLoading(false)
    })
  }, [anonTools])

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="h-4 w-36 bg-muted animate-pulse rounded" />
        <div className="h-24 w-full bg-muted/40 animate-pulse rounded" />
      </div>
    )
  }

  if (!data) return null

  const weakTools = sentiment?.tools.filter(t => t.pulse < 50) ?? []

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          <h3 className="font-semibold text-sm">How You Compare</h3>
        </div>
        {data.isIndustryBenchmark ? (
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Industry avg</span>
        ) : (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />{data.userCount} users
          </span>
        )}
      </div>

      <GaugeMeter percentile={data.percentile} />

      {/* Spend comparison */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="space-y-0.5">
          <p className="text-lg font-bold">${data.userTotal}</p>
          <p className="text-[10px] text-muted-foreground">Your spend</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-lg font-bold text-muted-foreground">${data.avgMonthly}</p>
          <p className="text-[10px] text-muted-foreground">Average</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-lg font-bold text-muted-foreground">${data.median}</p>
          <p className="text-[10px] text-muted-foreground">Median</p>
        </div>
      </div>

      {/* Distribution range */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Spend distribution</p>
        {(() => {
          const maxVal = Math.max(data.p90, data.userTotal, 1)
          const userPct = Math.min((data.userTotal / maxVal) * 100, 98)
          const markerColor = spendBarColor(data.percentile)
          const bandColor = data.percentile <= 30 ? 'bg-emerald-500/20' :
            data.percentile <= 60 ? 'bg-blue-500/20' :
            data.percentile <= 80 ? 'bg-amber-500/20' : 'bg-red-500/20'
          return (
            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`absolute top-0 bottom-0 ${bandColor} rounded-full`}
                style={{
                  left: `${(data.p25 / maxVal) * 100}%`,
                  width: `${((data.p75 - data.p25) / maxVal) * 100}%`,
                }}
              />
              <div
                className={`absolute top-0 bottom-0 w-1 ${markerColor} rounded-full`}
                style={{ left: `${userPct}%` }}
              />
            </div>
          )
        })()}
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>${data.p25}</span>
          <span>${data.p75}</span>
          <span>${data.p90}+</span>
        </div>
      </div>

      {/* Stack Pulse - Community Sentiment */}
      {sentiment && sentiment.tools.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-purple-500" />
              <p className="text-xs font-semibold">Community Pulse</p>
            </div>
            <span className={`text-xs font-bold ${pulseTextColor(sentiment.stackPulse)}`}>
              {sentiment.stackPulse}/100
            </span>
          </div>

          {/* Overall stack pulse bar */}
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${pulseBarColor(sentiment.stackPulse)} transition-all duration-700`}
                style={{ width: `${sentiment.stackPulse}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Your stack rates <strong className="text-foreground">{sentiment.stackLabel}</strong> across {sentiment.toolCount} tools
              {weakTools.length > 0 && (
                <> — {weakTools.length} tool{weakTools.length > 1 ? 's' : ''} need{weakTools.length === 1 ? 's' : ''} attention</>
              )}
            </p>
          </div>

          {/* Per-tool pulse breakdown */}
          <div className="space-y-0.5">
            {sentiment.tools.map(tool => (
              <PulseBar key={tool.toolId} tool={tool} />
            ))}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {data.categoryBreakdown.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground">By Category</p>
          {data.categoryBreakdown.slice(0, 5).map(cat => (
            <CategoryBar
              key={cat.categoryId}
              name={cat.categoryName}
              userSpend={cat.userSpend}
              avgSpend={cat.avgSpend}
            />
          ))}
        </div>
      )}
    </div>
  )
}
