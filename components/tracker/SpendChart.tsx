'use client'

import { useMemo } from 'react'

type Subscription = {
  created_at: string
  monthly_cost: number
  tools: { name: string } | null
}

interface SpendChartProps {
  subscriptions: Subscription[]
}

/**
 * Lightweight SVG line chart showing cumulative monthly spend over time.
 * Each data point is a month; the y-axis is total $/mo at that point.
 */
export function SpendChart({ subscriptions }: SpendChartProps) {
  const data = useMemo(() => {
    if (subscriptions.length === 0) return []

    // Sort by created_at
    const sorted = [...subscriptions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )

    // Build monthly snapshots: each month shows cumulative spend
    const months = new Map<string, number>()
    let cumulative = 0

    for (const sub of sorted) {
      const d = new Date(sub.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      cumulative += Number(sub.monthly_cost)
      months.set(key, cumulative)
    }

    // Fill in gaps between first and last month
    const keys = [...months.keys()]
    if (keys.length < 2) {
      // If only one month, add current month as second point
      const now = new Date()
      const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      if (!months.has(nowKey)) {
        months.set(nowKey, cumulative)
      }
    }

    const allKeys = [...months.keys()].sort()
    const first = allKeys[0]
    const last = allKeys[allKeys.length - 1]
    const [fy, fm] = first.split('-').map(Number)
    const [ly, lm] = last.split('-').map(Number)

    const filled: { month: string; label: string; value: number }[] = []
    let prevValue = 0

    for (let y = fy, m = fm; y < ly || (y === ly && m <= lm); m++) {
      if (m > 12) { m = 1; y++ }
      const key = `${y}-${String(m).padStart(2, '0')}`
      const value = months.get(key) ?? prevValue
      prevValue = value
      const label = new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short' })
      filled.push({ month: key, label, value })
    }

    return filled
  }, [subscriptions])

  if (data.length < 2) return null

  const W = 400
  const H = 120
  const PAD_X = 40
  const PAD_Y = 20
  const chartW = W - PAD_X * 2
  const chartH = H - PAD_Y * 2

  const maxVal = Math.max(...data.map(d => d.value), 1)
  const points = data.map((d, i) => ({
    x: PAD_X + (i / (data.length - 1)) * chartW,
    y: PAD_Y + chartH - (d.value / maxVal) * chartH,
    ...d,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${PAD_Y + chartH} L ${points[0].x} ${PAD_Y + chartH} Z`

  // Show labels for first, middle, last
  const labelIndices = [0, Math.floor(data.length / 2), data.length - 1]
  const uniqueLabels = [...new Set(labelIndices)]

  return (
    <div className="rounded-xl border border-foreground/[0.06] p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Monthly Spend Over Time</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = PAD_Y + chartH - pct * chartH
          return (
            <g key={pct}>
              <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y} stroke="currentColor" strokeOpacity={0.06} />
              <text x={PAD_X - 4} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={8}>
                ${Math.round(maxVal * pct)}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#spendGradient)" />
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Line */}
        <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="hsl(var(--primary))" />
        ))}

        {/* Month labels */}
        {uniqueLabels.map(i => (
          <text key={i} x={points[i].x} y={H - 2} textAnchor="middle" className="fill-muted-foreground" fontSize={8}>
            {points[i].label}
          </text>
        ))}
      </svg>
    </div>
  )
}
