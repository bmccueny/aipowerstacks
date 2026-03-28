'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, TrendingDown, TrendingUp, Loader2, DollarSign } from 'lucide-react'

type Subscription = {
  id: string
  tool_id: string
  monthly_cost: number
  billing_cycle: string
  created_at: string
  is_usage_based?: boolean
  use_tags?: string[] | null
  tools: { name: string; slug: string; logo_url: string | null; pricing_model: string; use_case?: string | null; category_id?: string | null; categories?: { name: string } | null } | null
}

type ToolOption = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  pricing_model: string
}

type AnonSub = {
  tool_id: string
  monthly_cost: number
  tool: ToolOption
}

type PricingTier = {
  tier_name: string
  monthly_price: number
  features: string | null
}

type TrackerSubscriptionListProps = {
  effectiveSubs: Subscription[]
  anonSubs: AnonSub[]
  effectiveCount: number
  priceTrends: Record<string, number>
  clientLoggedIn: boolean
  loading: boolean
  onRemoveSub: (id: string) => void
  onUpdateSubCost: (subId: string, newCost: number) => Promise<void>
}

export function TrackerSubscriptionList({
  effectiveSubs,
  anonSubs,
  effectiveCount,
  priceTrends,
  clientLoggedIn,
  loading,
  onRemoveSub,
  onUpdateSubCost,
}: TrackerSubscriptionListProps) {
  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [editTiers, setEditTiers] = useState<PricingTier[]>([])
  const [editTiersLoading, setEditTiersLoading] = useState(false)

  const startEditTier = (subId: string, toolId: string) => {
    if (editingSubId === subId) { setEditingSubId(null); return }
    setEditingSubId(subId)
    setEditTiersLoading(true)
    fetch(`/api/tracker/tiers?tool_id=${toolId}`)
      .then(r => r.json())
      .then(d => { setEditTiers(d.tiers || []); setEditTiersLoading(false) })
      .catch(() => { setEditTiers([]); setEditTiersLoading(false) })
  }

  const handleUpdateCost = async (subId: string, newCost: number) => {
    await onUpdateSubCost(subId, newCost)
    setEditingSubId(null)
  }

  if (effectiveCount === 0) {
    return (
      <div className="glass-card rounded-xl p-8 sm:p-12 text-center">
        <DollarSign className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-lg font-bold mb-1">No subscriptions tracked yet</p>
        <p className="text-sm text-muted-foreground">Search for a tool above to get started</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {/* Authenticated subs */}
        {effectiveSubs.map(sub => {
          const trend = priceTrends[sub.tool_id]
          const isEditing = editingSubId === sub.id
          return (
            <div key={sub.id}>
              <div className="glass-card rounded-xl px-5 py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {sub.tools?.logo_url ? (
                    <Image src={sub.tools.logo_url} alt={sub.tools.name} width={40} height={40} className="w-10 h-10 object-contain" unoptimized />
                  ) : (
                    <span className="text-sm font-bold text-primary">{sub.tools?.name?.[0] || '?'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/tools/${sub.tools?.slug || ''}`} className="font-bold text-sm hover:text-primary transition-colors">
                    {sub.tools?.name || 'Unknown Tool'}
                  </Link>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{sub.tools?.pricing_model || 'paid'}</p>
                    {trend != null && trend !== 0 && (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        trend > 0
                          ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                      }`}>
                        {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {trend > 0 ? '+' : ''}{trend}%
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => startEditTier(sub.id, sub.tool_id)}
                  className="flex items-center gap-1.5 hover:bg-muted/80 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <span className="text-lg font-black">
                    {Number(sub.monthly_cost) === 0 ? 'Free' : `$${Number(sub.monthly_cost).toFixed(2)}`}
                  </span>
                  {Number(sub.monthly_cost) > 0 && <span className="text-xs text-muted-foreground font-normal">/mo</span>}
                  <span className="text-[10px] text-primary">edit</span>
                </button>
                <button onClick={() => onRemoveSub(sub.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {isEditing && (
                <div className="px-5 pb-3 pt-1 flex flex-wrap gap-1.5">
                  {editTiersLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Loading plans...</span>
                    </div>
                  ) : editTiers.length > 0 ? editTiers.map(tier => (
                    <button
                      key={tier.tier_name}
                      type="button"
                      onClick={() => handleUpdateCost(sub.id, tier.monthly_price)}
                      className={`px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                        Number(sub.monthly_cost) === tier.monthly_price
                          ? 'border-primary/40 bg-primary/10 font-bold'
                          : 'border-foreground/[0.06] hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <span className="font-bold">{tier.monthly_price === 0 ? 'Free' : `$${tier.monthly_price}`}</span>
                      <span className="text-muted-foreground ml-1">{tier.tier_name}</span>
                    </button>
                  )) : (
                    [0, 10, 20, 50, 100, 200].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleUpdateCost(sub.id, p)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          Number(sub.monthly_cost) === p
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-foreground/[0.06] hover:border-primary/30 hover:bg-primary/5'
                        }`}
                      >
                        {p === 0 ? 'Free' : `$${p}`}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Anonymous subs */}
        {anonSubs.map(sub => (
          <div key={sub.tool_id} className="glass-card rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
              {sub.tool.logo_url ? (
                <Image src={sub.tool.logo_url} alt={sub.tool.name} width={40} height={40} className="w-10 h-10 object-contain" unoptimized />
              ) : (
                <span className="text-sm font-bold text-primary">{sub.tool.name[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/tools/${sub.tool.slug}`} className="font-bold text-sm hover:text-primary transition-colors">
                {sub.tool.name}
              </Link>
              <p className="text-xs text-muted-foreground">{sub.tool.pricing_model}</p>
            </div>
            <p className="text-lg font-black shrink-0">
              {sub.monthly_cost === 0 ? 'Free' : `$${sub.monthly_cost.toFixed(2)}`}
              {sub.monthly_cost > 0 && <span className="text-xs text-muted-foreground font-normal">/mo</span>}
            </p>
            <button onClick={() => onRemoveSub(sub.tool_id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Teaser after first tool */}
      {effectiveCount === 1 && (
        <div className="rounded-xl border border-dashed border-primary/20 bg-primary/[0.02] p-5 text-center">
          <p className="text-sm font-bold mb-1">Add one more tool to unlock insights</p>
          <p className="text-xs text-muted-foreground">Overlap detection, savings analysis, and stack optimization activate at 2+ tools</p>
        </div>
      )}

      {/* Save your stack CTA for anonymous users */}
      {!loading && !clientLoggedIn && anonSubs.length > 0 && (
        <Link href={`/login?redirectTo=${encodeURIComponent('/tracker')}`} className="block">
          <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/[0.06] to-primary/[0.02] p-5 text-center hover:border-primary/50 transition-all cursor-pointer">
            <p className="text-sm font-bold text-primary mb-1">Save your stack &amp; unlock full analysis</p>
            <p className="text-xs text-muted-foreground">Sign in to access overlap detection, savings reports, and AI-powered optimization</p>
          </div>
        </Link>
      )}
    </>
  )
}
