'use client'

import { useState, useEffect } from 'react'
import { Layers, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type TierInfo = {
  name: string
  price: number
  features: string[]
}

type Comparison = {
  tool_id: string
  tool_name: string
  tool_slug: string
  logo_url: string | null
  current_cost: number
  current_tier: TierInfo | null
  next_tier: TierInfo | null
  all_tiers: TierInfo[]
}

export function FreeTierDetector() {
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tracker/tier-compare')
      .then(r => r.json())
      .then(d => {
        setComparisons(d.comparisons || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5 flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Comparing tiers...</span>
      </div>
    )
  }

  if (comparisons.length === 0) return null

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
          <Layers className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Tier Comparison</h3>
          <p className="text-xs text-muted-foreground">
            See what you get at your current tier vs what&apos;s available
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {comparisons.map(comp => {
          const isExpanded = expanded === comp.tool_id
          return (
            <div key={comp.tool_id} className="rounded-lg border border-foreground/[0.06] overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : comp.tool_id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="h-8 w-8 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {comp.logo_url ? (
                    <Image src={comp.logo_url} alt={comp.tool_name} width={32} height={32} className="w-8 h-8 object-contain" unoptimized />
                  ) : (
                    <span className="text-xs font-bold text-primary">{comp.tool_name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-sm">{comp.tool_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {comp.current_tier ? comp.current_tier.name : `$${comp.current_cost}/mo`}
                    {' · '}{comp.all_tiers.length} tier{comp.all_tiers.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <span className="text-xs font-bold text-muted-foreground shrink-0">${comp.current_cost}/mo</span>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-foreground/[0.06]">
                  <div className="mt-3 space-y-2">
                    {comp.all_tiers.map(tier => {
                      const isCurrent = comp.current_tier && Math.abs(tier.price - comp.current_tier.price) < 0.5
                      return (
                        <div
                          key={tier.name}
                          className={`rounded-lg px-3 py-2.5 ${isCurrent ? 'border-2 border-primary/30 bg-primary/5' : 'border border-foreground/[0.06]'}`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              {tier.name}
                              {isCurrent && (
                                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                  Your plan
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">${tier.price}/mo</span>
                          </div>
                          {tier.features.length > 0 && (
                            <ul className="space-y-0.5">
                              {tier.features.slice(0, 5).map((f, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                  <span className={`shrink-0 ${isCurrent ? 'text-primary' : 'text-muted-foreground/50'}`}>·</span>
                                  {f}
                                </li>
                              ))}
                              {tier.features.length > 5 && (
                                <li className="text-xs text-muted-foreground/60 italic">+{tier.features.length - 5} more</li>
                              )}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <Link
                    href={`/tools/${comp.tool_slug}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-violet-500 hover:text-violet-600 transition-colors"
                  >
                    View full details →
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
