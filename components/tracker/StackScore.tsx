'use client'

import { useState, useEffect, useRef } from 'react'
import { Lightbulb, Shield, Gauge, Layers, Gem } from 'lucide-react'

type ScoreData = {
  score: number
  grade: string
  breakdown: {
    overlap: number
    efficiency: number
    coverage: number
    value: number
  }
  tips: string[]
}

const BREAKDOWN_META = [
  { key: 'overlap' as const, label: 'No Overlap', icon: Layers, color: 'bg-blue-500' },
  { key: 'efficiency' as const, label: 'Cost Efficiency', icon: Gauge, color: 'bg-emerald-500' },
  { key: 'coverage' as const, label: 'Coverage', icon: Shield, color: 'bg-purple-500' },
  { key: 'value' as const, label: 'Value', icon: Gem, color: 'bg-amber-500' },
]

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-emerald-500'
    case 'B': return 'text-blue-500'
    case 'C': return 'text-yellow-500'
    case 'D': return 'text-orange-500'
    default: return 'text-red-500'
  }
}

function getGradeRing(grade: string): string {
  switch (grade) {
    case 'A': return 'stroke-emerald-500'
    case 'B': return 'stroke-blue-500'
    case 'C': return 'stroke-yellow-500'
    case 'D': return 'stroke-orange-500'
    default: return 'stroke-red-500'
  }
}

export function StackScore() {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [barsAnimated, setBarsAnimated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/tracker/score')
      .then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then(d => setData(d))
      .catch(() => { /* not enough subs or not logged in */ })
      .finally(() => setLoading(false))
  }, [])

  // Animate score counter
  useEffect(() => {
    if (!data) return
    const target = data.score
    const duration = 1200
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    // Trigger bar animations after short delay
    const timer = setTimeout(() => setBarsAnimated(true), 300)
    return () => clearTimeout(timer)
  }, [data])

  if (loading || !data) return null

  const circumference = 2 * Math.PI * 54
  const offset = circumference - (animatedScore / 100) * circumference

  return (
    <div ref={containerRef} className="rounded-xl border border-foreground/[0.06] p-5 space-y-5">
      <h3 className="text-sm font-medium text-muted-foreground">Stack Score</h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circular grade */}
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              strokeWidth="8"
              className="stroke-foreground/[0.06]"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={`${getGradeRing(data.grade)} transition-all duration-1000 ease-out`}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getGradeColor(data.grade)}`}>
              {data.grade}
            </span>
            <span className="text-xs text-muted-foreground">{animatedScore}/100</span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="flex-1 w-full space-y-3">
          {BREAKDOWN_META.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
                <span className="font-medium">{data.breakdown[key]}</span>
              </div>
              <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
                  style={{ width: barsAnimated ? `${data.breakdown[key]}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      {data.tips.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-foreground/[0.06]">
          {data.tips.slice(0, 3).map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Lightbulb className="h-4 w-4 shrink-0 text-yellow-500 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
