'use client'

import { useState, useEffect } from 'react'
import { Gift, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type Alternative = {
  tool_id: string
  tool_name: string
  tool_slug: string
  logo_url: string | null
  current_cost: number
  free_tier_name: string
  free_features: string[]
  paid_tier_name: string
  paid_features: string[]
  monthly_savings: number
}

export function FreeTierDetector() {
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tracker/free-tier-check')
      .then(r => r.json())
      .then(d => {
        setAlternatives(d.alternatives || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5 flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Checking free tiers...</span>
      </div>
    )
  }

  if (alternatives.length === 0) return null

  const totalSavings = alternatives.reduce((sum, a) => sum + a.monthly_savings, 0)

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <Gift className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Free tier alternatives</h3>
          <p className="text-xs text-muted-foreground">
            {alternatives.length} tool{alternatives.length > 1 ? 's have' : ' has a'} free tier — potential savings of{' '}
            <span className="font-bold text-blue-500">${totalSavings.toFixed(0)}/mo</span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {alternatives.map(alt => {
          const isExpanded = expanded === alt.tool_id
          return (
            <div key={alt.tool_id} className="rounded-lg border border-foreground/[0.06] overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : alt.tool_id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="h-8 w-8 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {alt.logo_url ? (
                    <Image src={alt.logo_url} alt={alt.tool_name} width={32} height={32} className="w-8 h-8 object-contain" unoptimized />
                  ) : (
                    <span className="text-xs font-bold text-primary">{alt.tool_name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-sm">{alt.tool_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Paying ${alt.current_cost}/mo · Free &ldquo;{alt.free_tier_name}&rdquo; available
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-500 shrink-0">-${alt.monthly_savings}/mo</span>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-foreground/[0.06]">
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
                        Free — {alt.free_tier_name}
                      </p>
                      {alt.free_features.length > 0 ? (
                        <ul className="space-y-1">
                          {alt.free_features.map((f, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                              <span className="text-emerald-500 shrink-0">✓</span>{f}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No feature details available</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
                        Paid — {alt.paid_tier_name} (${alt.current_cost}/mo)
                      </p>
                      {alt.paid_features.length > 0 ? (
                        <ul className="space-y-1">
                          {alt.paid_features.map((f, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                              <span className="text-primary shrink-0">★</span>{f}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No feature details available</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/tools/${alt.tool_slug}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    View {alt.tool_name} plans →
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
