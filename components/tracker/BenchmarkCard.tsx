'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus, Users } from 'lucide-react'

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

function GaugeMeter({ percentile }: { percentile: number }) {
  // CSS-only semicircular gauge
  const rotation = (percentile / 100) * 180 - 90 // -90 to 90 degrees
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
        {/* Background arc */}
        <div className="absolute inset-0 rounded-t-full border-[12px] border-b-0 border-muted" />
        {/* Colored fill segments */}
        <div className="absolute inset-0 rounded-t-full border-[12px] border-b-0 border-transparent"
          style={{
            borderTopColor: 'var(--gauge-color)',
            borderLeftColor: percentile > 25 ? 'var(--gauge-color)' : 'transparent',
            borderRightColor: percentile > 75 ? 'var(--gauge-color)' : 'transparent',
            // @ts-expect-error CSS custom property
            '--gauge-color': percentile <= 30 ? '#10b981' : percentile <= 60 ? '#3b82f6' : percentile <= 80 ? '#f59e0b' : '#ef4444',
          }}
        />
        {/* Needle */}
        <div
          className="absolute bottom-0 left-1/2 origin-bottom h-16 w-0.5 bg-foreground transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
        {/* Center dot */}
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
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${userWidth}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-12 text-right">${userSpend}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-8">Avg</span>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-muted-foreground/30 transition-all duration-500"
              style={{ width: `${avgWidth}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-12 text-right">${avgSpend}</span>
        </div>
      </div>
    </div>
  )
}

export function BenchmarkCard() {
  const [data, setData] = useState<BenchmarkData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tracker/benchmark')
      .then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="h-4 w-36 bg-muted animate-pulse rounded" />
        <div className="h-24 w-full bg-muted/40 animate-pulse rounded" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="glass-card rounded-xl p-5 space-y-5">
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
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          {/* IQR band */}
          <div
            className="absolute top-0 bottom-0 bg-blue-500/20 rounded-full"
            style={{
              left: `${(data.p25 / Math.max(data.p90, data.userTotal, 1)) * 100}%`,
              width: `${((data.p75 - data.p25) / Math.max(data.p90, data.userTotal, 1)) * 100}%`,
            }}
          />
          {/* User marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-blue-500 rounded-full"
            style={{ left: `${Math.min((data.userTotal / Math.max(data.p90, data.userTotal, 1)) * 100, 98)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>${data.p25}</span>
          <span>${data.p75}</span>
          <span>${data.p90}+</span>
        </div>
      </div>

      {/* Category breakdown */}
      {data.categoryBreakdown.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-foreground/[0.06]">
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
