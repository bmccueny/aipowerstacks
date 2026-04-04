'use client'

import { useState, useEffect } from 'react'
import { Users, Sparkles, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type Recommendation = {
  toolId: string
  toolName: string
  toolSlug: string
  logoUrl: string | null
  usedByCount: number
  cohortPercentage: number
}

type CohortData = {
  cohortSize: number
  recommendations: Recommendation[]
  message: string
}

export function CohortInsights({ anonTools }: { anonTools?: { tool_id: string }[] } = {}) {
  const [data, setData] = useState<CohortData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let url = '/api/tracker/cohort'
    if (anonTools && anonTools.length > 0) {
      url = `/api/tracker/cohort?tool_ids=${anonTools.map(t => t.tool_id).join(',')}`
    }
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [anonTools])

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="h-4 w-36 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted/40 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || (data.cohortSize === 0 && data.recommendations.length === 0)) {
    return null
  }

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-500" />
          <h3 className="font-semibold text-sm">Stacks Like Yours</h3>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {data.cohortSize} similar user{data.cohortSize !== 1 ? 's' : ''}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">{data.message}</p>

      {data.recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Users with similar stacks also use:
          </p>
          {data.recommendations.map(rec => (
            <Link
              key={rec.toolId}
              href={`/tools/${rec.toolSlug}`}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-foreground/[0.06] hover:bg-muted/50 transition-colors group"
            >
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {rec.logoUrl ? (
                  <Image src={rec.logoUrl} alt={rec.toolName} width={32} height={32} className="rounded-lg" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {rec.toolName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-blue-500 transition-colors">
                  {rec.toolName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Used by {rec.cohortPercentage}% of similar stacks
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${rec.cohortPercentage}%` }}
                  />
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
