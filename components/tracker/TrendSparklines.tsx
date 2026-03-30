'use client'

import { useState, useEffect } from 'react'

type PricePoint = {
  price: number
  recorded_at: string
}

type TrendSparklineProps = {
  toolId: string
  height?: number
  width?: number
}

export function TrendSparkline({ toolId, height = 20, width = 60 }: TrendSparklineProps) {
  const [points, setPoints] = useState<PricePoint[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    fetch(`/api/tracker/price-history?tool_id=${toolId}&since=${sixMonthsAgo.toISOString()}`)
      .then(r => r.json())
      .then(d => {
        setPoints(d.history || [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [toolId])

  if (!loaded || points.length < 2) return null

  const prices = points.map(p => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  // Determine trend: compare first half avg to second half avg
  const mid = Math.floor(prices.length / 2)
  const firstHalf = prices.slice(0, mid).reduce((s, v) => s + v, 0) / mid
  const secondHalf = prices.slice(mid).reduce((s, v) => s + v, 0) / (prices.length - mid)
  const isIncreasing = secondHalf > firstHalf * 1.02 // >2% increase
  const color = isIncreasing ? '#ef4444' : '#10b981' // red or green

  const padding = 2
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const pathPoints = prices.map((price, i) => {
    const x = padding + (i / (prices.length - 1)) * chartWidth
    const y = padding + (1 - (price - min) / range) * chartHeight
    return `${x},${y}`
  })

  const pathD = `M ${pathPoints.join(' L ')}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle"
      aria-label={`Price trend: ${isIncreasing ? 'increasing' : 'stable or decreasing'}`}
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={padding + chartWidth}
        cy={padding + (1 - (prices[prices.length - 1] - min) / range) * chartHeight}
        r={2}
        fill={color}
      />
    </svg>
  )
}
