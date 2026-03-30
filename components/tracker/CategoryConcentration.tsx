'use client'

import { useState, useEffect } from 'react'
import { PieChart, AlertTriangle } from 'lucide-react'

type CategoryData = {
  categoryName: string
  total: number
  percentage: number
}

const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

function DonutChart({ categories }: { categories: CategoryData[] }) {
  // CSS-only conic-gradient donut chart
  let accumulated = 0
  const stops = categories.map((cat, i) => {
    const start = accumulated
    accumulated += cat.percentage
    const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
    return `${color} ${start}% ${accumulated}%`
  })

  // Fill remaining to 100%
  if (accumulated < 100) {
    stops.push(`hsl(var(--muted)) ${accumulated}% 100%`)
  }

  return (
    <div className="relative w-36 h-36 mx-auto">
      <div
        className="w-full h-full rounded-full"
        style={{
          background: `conic-gradient(${stops.join(', ')})`,
        }}
      />
      {/* Inner circle for donut effect */}
      <div className="absolute inset-4 rounded-full bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold">{categories.length}</p>
          <p className="text-[10px] text-muted-foreground">categories</p>
        </div>
      </div>
    </div>
  )
}

export function CategoryConcentration() {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [totalSpend, setTotalSpend] = useState(0)
  const [loading, setLoading] = useState(true)
  const [concentrated, setConcentrated] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tracker')
      .then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then(d => {
        const subs = d.subscriptions || []
        if (subs.length === 0) {
          setLoading(false)
          return
        }

        // Group by category
        const catMap = new Map<string, number>()
        let total = 0
        for (const sub of subs) {
          const catName = sub.tools?.categories?.name || 'Other'
          const cost = Number(sub.monthly_cost)
          catMap.set(catName, (catMap.get(catName) || 0) + cost)
          total += cost
        }

        if (total === 0) {
          setLoading(false)
          return
        }

        const cats = Array.from(catMap.entries())
          .map(([name, amount]) => ({
            categoryName: name,
            total: Math.round(amount * 100) / 100,
            percentage: Math.round((amount / total) * 100),
          }))
          .sort((a, b) => b.total - a.total)

        setCategories(cats)
        setTotalSpend(total)

        // Check concentration
        const topCat = cats[0]
        if (topCat && topCat.percentage > 60) {
          setConcentrated(topCat.categoryName)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-foreground/[0.06] p-5 space-y-4">
        <div className="h-4 w-40 bg-muted animate-pulse rounded" />
        <div className="h-36 w-36 mx-auto bg-muted/40 animate-pulse rounded-full" />
      </div>
    )
  }

  if (categories.length === 0) return null

  return (
    <div className="rounded-xl border border-foreground/[0.06] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <PieChart className="h-4 w-4 text-violet-500" />
        <h3 className="font-semibold text-sm">Spend by Category</h3>
      </div>

      {/* Concentration warning */}
      {concentrated && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-600">
            <strong>{concentrated}</strong> accounts for over 60% of your AI spend — consider diversifying
          </p>
        </div>
      )}

      <DonutChart categories={categories} />

      {/* Legend */}
      <div className="space-y-2">
        {categories.map((cat, i) => (
          <div key={cat.categoryName} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
              />
              <span className="truncate">{cat.categoryName}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>${cat.total}</span>
              <span className="w-8 text-right">{cat.percentage}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-foreground/[0.06] flex justify-between text-xs">
        <span className="text-muted-foreground">Total</span>
        <span className="font-medium">${Math.round(totalSpend)}/mo</span>
      </div>
    </div>
  )
}
