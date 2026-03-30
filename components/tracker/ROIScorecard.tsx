'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, DollarSign } from 'lucide-react'
import Image from 'next/image'

type ROITool = {
  toolId: string
  toolName: string
  toolSlug: string
  logoUrl: string | null
  monthlyCost: number
  weeksTracked: number
  weeksUsed: number
  usageRate: number
  costPerUse: number | null
  roi: 'high' | 'medium' | 'low'
  suggestion: string | null
}

type ROISummary = {
  totalMonthly: number
  lowRoiCount: number
  potentialSavings: number
  highRoiCount: number
}

const ROI_CONFIG = {
  high: {
    label: 'High ROI',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  medium: {
    label: 'Medium',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    dotColor: 'bg-blue-500',
    icon: Clock,
  },
  low: {
    label: 'Low ROI',
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
    dotColor: 'bg-red-500',
    icon: AlertTriangle,
  },
}

function ROIBadge({ roi }: { roi: 'high' | 'medium' | 'low' }) {
  const config = ROI_CONFIG[roi]
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

function UsageBar({ rate }: { rate: number }) {
  const color = rate >= 75 ? 'bg-emerald-500' : rate >= 50 ? 'bg-blue-500' : rate >= 25 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${rate}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-8 text-right">{rate}%</span>
    </div>
  )
}

export function ROIScorecard() {
  const [tools, setTools] = useState<ROITool[]>([])
  const [summary, setSummary] = useState<ROISummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tracker/roi')
      .then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then(d => {
        setTools(d.tools || [])
        setSummary(d.summary || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-foreground/[0.06] p-5 space-y-4">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted/40 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (tools.length === 0) return null

  return (
    <div className="rounded-xl border border-foreground/[0.06] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <h3 className="font-semibold text-sm">ROI Scorecard</h3>
        </div>
        {summary && summary.highRoiCount > 0 && (
          <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            {summary.highRoiCount} high ROI
          </span>
        )}
      </div>

      {/* Summary banner for savings */}
      {summary && summary.potentialSavings > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <DollarSign className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">
              ${summary.potentialSavings}/mo in low-ROI tools
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.lowRoiCount} tool{summary.lowRoiCount !== 1 ? 's' : ''} with low usage — consider canceling
            </p>
          </div>
        </div>
      )}

      {/* Tool list */}
      <div className="space-y-2">
        {tools.map(tool => (
          <div
            key={tool.toolId}
            className={`p-3 rounded-lg border transition-colors ${
              tool.roi === 'low'
                ? 'border-red-500/10 bg-red-500/[0.02]'
                : 'border-foreground/[0.06]'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Tool icon */}
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {tool.logoUrl ? (
                  <Image src={tool.logoUrl} alt={tool.toolName} width={32} height={32} className="rounded-lg" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {tool.toolName.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{tool.toolName}</span>
                  <ROIBadge roi={tool.roi} />
                </div>

                {/* Usage bar */}
                <UsageBar rate={tool.usageRate} />

                {/* Stats row */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>${tool.monthlyCost}/mo</span>
                  {tool.costPerUse !== null && (
                    <span>~${tool.costPerUse}/use</span>
                  )}
                  <span>{tool.weeksUsed}/{tool.weeksTracked} weeks used</span>
                </div>

                {/* Suggestion */}
                {tool.suggestion && (
                  <p className={`text-[10px] ${tool.roi === 'low' ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {tool.roi === 'low' && <TrendingDown className="h-3 w-3 inline mr-1" />}
                    {tool.suggestion}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
