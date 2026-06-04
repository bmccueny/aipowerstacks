'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type PricePoint = { tier_name: string; monthly_price: number; snapshot_date: string }

export function PriceHistoryChart({ slug }: { slug: string }) {
  const [history, setHistory] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tools/${slug}/price-history`)
      .then(r => r.json())
      .then(d => setHistory(d.history ?? []))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="h-20 animate-pulse rounded-lg bg-muted/30" />
  if (history.length < 2) return null

  // Group by tier, show the most common tier's trend
  const tiers = [...new Set(history.map(h => h.tier_name))]
  const mainTier = tiers[0]
  const tierHistory = history.filter(h => h.tier_name === mainTier)

  const first = tierHistory[0].monthly_price
  const last = tierHistory[tierHistory.length - 1].monthly_price
  const change = last - first
  const changePct = first > 0 ? Math.round((change / first) * 100) : 0

  const maxPrice = Math.max(...tierHistory.map(h => h.monthly_price))
  const minPrice = Math.min(...tierHistory.map(h => h.monthly_price))
  const range = maxPrice - minPrice || 1

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Price History (90 days)</h3>
        <div className={`flex items-center gap-1 text-xs font-bold ${
          change > 0 ? 'text-red-500' : change < 0 ? 'text-emerald-500' : 'text-muted-foreground'
        }`}>
          {change > 0 ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {changePct > 0 ? '+' : ''}{changePct}%
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{mainTier}</span>
        <span>·</span>
        <span>${first}/mo → ${last}/mo</span>
      </div>
      {/* SVG sparkline */}
      <svg viewBox="0 0 200 40" className="w-full h-10" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={change > 0 ? 'text-red-500' : change < 0 ? 'text-emerald-500' : 'text-primary'}
          points={tierHistory.map((h, i) => {
            const x = (i / (tierHistory.length - 1)) * 200
            const y = 40 - ((h.monthly_price - minPrice) / range) * 36
            return `${x},${y}`
          }).join(' ')}
        />
      </svg>
    </div>
  )
}
