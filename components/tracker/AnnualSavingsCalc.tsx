'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, Loader2, TrendingDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type SavingsItem = {
  tool_id: string
  tool_name: string
  tool_slug: string
  logo_url: string | null
  tier_name: string
  monthly_price: number
  annual_price: number
  yearly_if_monthly: number
  annual_savings: number
  savings_percent: number
}

type AnonTool = { tool_id: string; monthly_cost: number }

export function AnnualSavingsCalc({ anonTools }: { anonTools?: AnonTool[] } = {}) {
  const [savings, setSavings] = useState<SavingsItem[]>([])
  const [totalSavings, setTotalSavings] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const opts = anonTools && anonTools.length > 0
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tools: anonTools }) }
      : {}
    fetch('/api/tracker/annual-savings', opts)
      .then(r => r.json())
      .then(d => {
        setSavings(d.savings || [])
        setTotalSavings(d.totalAnnualSavings || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [anonTools])

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5 flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Checking annual plans...</span>
      </div>
    )
  }

  if (savings.length === 0) return null

  const maxSavings = Math.max(...savings.map(s => s.annual_savings))

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
          <CalendarDays className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Switch to annual billing</h3>
          <p className="text-xs text-muted-foreground">
            Save <span className="font-bold text-emerald-500">${totalSavings.toFixed(0)}/year</span> by switching {savings.length} tool{savings.length > 1 ? 's' : ''} to annual plans
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {savings.map(item => {
          const isBiggest = item.annual_savings === maxSavings && savings.length > 1
          return (
            <div
              key={item.tool_id}
              className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
                isBiggest
                  ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                  : 'border-foreground/[0.06]'
              }`}
            >
              <div className="h-8 w-8 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {item.logo_url ? (
                  <Image src={item.logo_url} alt={item.tool_name} width={32} height={32} className="w-8 h-8 object-contain" unoptimized />
                ) : (
                  <span className="text-xs font-bold text-primary">{item.tool_name[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/tools/${item.tool_slug}`} className="font-bold text-sm hover:text-primary transition-colors">
                  {item.tool_name}
                </Link>
                <p className="text-xs text-muted-foreground">{item.tier_name}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground line-through">${item.yearly_if_monthly.toFixed(0)}</span>
                  <span className="font-bold">${item.annual_price.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground">/yr</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <TrendingDown className="h-3 w-3 text-emerald-500" />
                  <span className={`text-xs font-bold ${isBiggest ? 'text-emerald-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    Save ${item.annual_savings.toFixed(0)} ({item.savings_percent}%)
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
