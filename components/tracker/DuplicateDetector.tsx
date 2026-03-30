'use client'

import { useState, useEffect } from 'react'
import { Copy, Loader2, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type ToolInfo = {
  tool_id: string
  name: string
  slug: string
  logo_url: string | null
  monthly_cost: number
  rating: number
  reviews: number
}

type Duplicate = {
  pair: [ToolInfo, ToolInfo]
  category: string
  overlap_reason: string
  combined_cost: number
  recommendation: { keep: string; keep_slug: string; reason: string }
}

export function DuplicateDetector() {
  const [duplicates, setDuplicates] = useState<Duplicate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tracker/duplicates')
      .then(r => r.json())
      .then(d => {
        setDuplicates(d.duplicates || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5 flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Scanning for duplicates...</span>
      </div>
    )
  }

  if (duplicates.length === 0) return null

  const totalOverlapCost = duplicates.reduce((sum, d) => sum + d.combined_cost, 0)

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Copy className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Overlapping tools detected</h3>
          <p className="text-xs text-muted-foreground">
            {duplicates.length} pair{duplicates.length > 1 ? 's' : ''} with similar functionality — combined cost{' '}
            <span className="font-bold text-amber-500">${totalOverlapCost.toFixed(0)}/mo</span>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {duplicates.map((dup, idx) => {
          const [a, b] = dup.pair
          return (
            <div key={idx} className="rounded-lg border border-foreground/[0.06] p-4 space-y-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                <span>{dup.category}</span>
                <span>·</span>
                <span>{dup.overlap_reason}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[a, b].map(tool => {
                  const isKeep = tool.name === dup.recommendation.keep
                  return (
                    <div
                      key={tool.tool_id}
                      className={`rounded-lg border p-3 ${
                        isKeep
                          ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                          : 'border-foreground/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-7 w-7 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">
                          {tool.logo_url ? (
                            <Image src={tool.logo_url} alt={tool.name} width={28} height={28} className="w-7 h-7 object-contain" unoptimized />
                          ) : (
                            <span className="text-[10px] font-bold text-primary">{tool.name[0]}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/tools/${tool.slug}`} className="font-bold text-xs hover:text-primary transition-colors block truncate">
                            {tool.name}
                          </Link>
                          {isKeep && (
                            <span className="text-[10px] font-bold text-emerald-500">★ Recommended</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold">${tool.monthly_cost}/mo</span>
                        {tool.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {tool.rating.toFixed(1)}
                            <span className="text-[10px]">({tool.reviews})</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                💡 {dup.recommendation.reason}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
