'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, DollarSign, TrendingDown, Loader2, Search, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { SavingsReport } from './SavingsReport'
import { StackOptimizer } from './StackOptimizer'
import { StackIntel } from './StackIntel'

type Subscription = {
  id: string
  tool_id: string
  monthly_cost: number
  billing_cycle: string
  created_at: string
  is_usage_based?: boolean
  tools: { name: string; slug: string; logo_url: string | null; pricing_model: string; use_case?: string | null; category_id?: string | null; categories?: { name: string } | null } | null
}

type ToolOption = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  pricing_model: string
}

type PricingTier = {
  tier_name: string
  monthly_price: number
  features: string | null
}


const USE_CASE_NAMES: Record<string, string> = {
  'content-creation': 'Content Creation',
  coding: 'Coding & Development',
  marketing: 'Marketing',
  design: 'Design',
  research: 'Research',
  video: 'Video',
  sales: 'Sales',
  'customer-support': 'Customer Support',
}

export function TrackerClient({ tools, autoAddSlug, importTools }: { tools: ToolOption[]; autoAddSlug?: string; importTools?: string }) {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedTool, setSelectedTool] = useState<ToolOption | null>(null)
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [tiersLoading, setTiersLoading] = useState(false)
  const [customCost, setCustomCost] = useState('')
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [autoAddHandled, setAutoAddHandled] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/tracker')
      .then(r => r.json())
      .then(d => { setSubs(d.subscriptions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Auto-select tool from ?add= query param after subs load
  useEffect(() => {
    if (autoAddHandled || loading || !autoAddSlug) return
    setAutoAddHandled(true)
    const alreadyTracked = new Set(subs.map(s => s.tool_id))
    const match = tools.find(t => t.slug === autoAddSlug && !alreadyTracked.has(t.id))
    if (match) {
      setSelectedTool(match)
    }
  }, [autoAddSlug, autoAddHandled, loading, subs, tools])

  // Bulk import tools from ?import=slug:price,slug:price (from homepage calculator)
  useEffect(() => {
    if (autoAddHandled || loading || !importTools) return
    setAutoAddHandled(true)
    const alreadyTracked = new Set(subs.map(s => s.tool_id))
    const entries = importTools.split(',').map(entry => {
      const [slug, priceStr] = entry.split(':')
      return { slug, price: parseFloat(priceStr) || 0 }
    }).filter(e => e.slug)

    const toAdd = entries
      .map(e => ({ tool: tools.find(t => t.slug === e.slug), price: e.price }))
      .filter((e): e is { tool: ToolOption; price: number } => e.tool != null && !alreadyTracked.has(e.tool.id))

    if (toAdd.length === 0) return

    setImporting(true)
    Promise.all(
      toAdd.map(({ tool, price }) =>
        fetch('/api/tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool_id: tool.id, monthly_cost: price }),
        })
      )
    ).then(() => {
      fetch('/api/tracker')
        .then(r => r.json())
        .then(d => {
          setSubs(d.subscriptions || [])
          setImporting(false)
          toast.success(`Added ${toAdd.length} subscriptions from your calculator`)
        })
    })
  }, [importTools, autoAddHandled, loading, subs, tools])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load pricing tiers when tool is selected
  useEffect(() => {
    if (!selectedTool) { setTiers([]); return }
    setTiersLoading(true)
    fetch(`/api/tracker/tiers?tool_id=${selectedTool.id}`)
      .then(r => r.json())
      .then(d => { setTiers(d.tiers || []); setTiersLoading(false) })
      .catch(() => setTiersLoading(false))
  }, [selectedTool])

  // Single dashboard fetch — replaces benchmark, report, stack-intel, analyze
  const fetchDashboard = useCallback(() => {
    if (subs.length < 2) { setDashboardData(null); return }
    setDashboardLoading(true)
    fetch('/api/tracker/dashboard')
      .then(r => r.json())
      .then(d => { setDashboardData(d.dashboard || null); setDashboardLoading(false) })
      .catch(() => setDashboardLoading(false))
  }, [subs.length])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const selectTool = (tool: ToolOption) => {
    setSelectedTool(tool)
    setSearch('')
    setShowDropdown(false)
  }

  const addSub = async (price: number) => {
    if (!selectedTool || price < 0) return
    setAdding(true)
    const toolId = selectedTool.id
    const res = await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_id: toolId, monthly_cost: price }),
    })
    if (res.ok) {
      const data = await (await fetch('/api/tracker')).json()
      setSubs(data.subscriptions || [])
      setSelectedTool(null)
      setCustomCost('')
      toast.success('Subscription added')
    } else {
      toast.error('Failed to add')
    }
    setAdding(false)
  }

  const removeSub = async (id: string) => {
    const res = await fetch(`/api/tracker?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSubs(prev => prev.filter(s => s.id !== id))
      toast.success('Removed')
    }
  }


  const total = subs.reduce((sum, s) => sum + Number(s.monthly_cost), 0)
  const yearly = total * 12
  const alreadyTracked = new Set(subs.map(s => s.tool_id))

  const filteredTools = search.length > 1
    ? tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) && !alreadyTracked.has(t.id)).slice(0, 10)
    : []

  // Compute overlaps — group by category + use_case (tightest match).
  // Tools must share BOTH to be considered competing.
  const overlaps = subs.length >= 2 ? (() => {
    const fixedSubs = subs.filter(s => !s.is_usage_based)
    const groups: Record<string, Subscription[]> = {}
    for (const sub of fixedSubs) {
      const catId = sub.tools?.category_id
      if (!catId) continue
      const useCase = sub.tools?.use_case || 'general'
      const key = `${catId}::${useCase}`
      if (!groups[key]) groups[key] = []
      groups[key].push(sub)
    }
    return Object.entries(groups)
      .filter(([, items]) => items.length >= 2 && items.some(s => Number(s.monthly_cost) > 0))
      .map(([groupKey, items]) => {
        const [, groupUseCase] = groupKey.split('::')
        const categoryName = items[0].tools?.categories?.name
        const label = groupUseCase && groupUseCase !== 'general'
          ? (USE_CASE_NAMES[groupUseCase] || groupUseCase)
          : (categoryName || 'Similar')
        return {
          useCase: groupKey,
          label,
          tools: items,
          totalCost: items.reduce((sum, s) => sum + Number(s.monthly_cost), 0),
        }
      })
  })() : []

  // Potential savings from overlaps
  const overlapSavings = overlaps.reduce((sum, o) => {
    const costs = o.tools.map(t => Number(t.monthly_cost)).sort((a, b) => a - b)
    // Could save everything except the cheapest
    return sum + costs.slice(1).reduce((s, c) => s + c, 0)
  }, 0)

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Import loading */}
      {importing && (
        <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-6 text-center flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-bold">Importing your tools...</p>
        </div>
      )}

      {/* Cost summary — hero layout */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-4xl sm:text-5xl font-black">${total.toFixed(0)}<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
          <p className="text-sm text-muted-foreground">${yearly.toFixed(0)}/yr · {subs.length} tool{subs.length !== 1 ? 's' : ''}{overlaps.length > 0 ? ` · ${overlaps.length} overlap${overlaps.length > 1 ? 's' : ''}` : ''}</p>
        </div>
        {overlapSavings > 0 && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] px-5 py-3 text-center shrink-0">
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">${(overlapSavings * 12).toFixed(0)}/yr</p>
            <p className="text-[10px] text-muted-foreground">potential savings</p>
          </div>
        )}
      </div>

      {/* Add subscription — z-20 so dropdown overlays the list below */}
      <div className="glass-card rounded-xl p-6 relative z-20">
        <h2 className="text-base font-bold mb-4">Add a subscription</h2>

        {!selectedTool ? (
          <div ref={wrapperRef} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search for a tool (e.g. ChatGPT, Cursor, Midjourney)..."
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
                onFocus={() => { if (search.length > 1) setShowDropdown(true) }}
                className="w-full pl-10 pr-4 py-3 text-base sm:text-sm rounded-xl border border-foreground/[0.12] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            {showDropdown && filteredTools.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-white dark:bg-neutral-900 border border-border rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                {filteredTools.map(t => (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => { e.preventDefault(); selectTool(t) }}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-muted/80 cursor-pointer border-b border-border/30 last:border-0 transition-colors"
                  >
                    {t.logo_url ? (
                      <img src={t.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain shrink-0" />
                    ) : (
                      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{t.name[0]}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.pricing_model}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showDropdown && search.length > 1 && filteredTools.length === 0 && (
              <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-white dark:bg-neutral-900 border border-border rounded-xl shadow-2xl px-4 py-3">
                <p className="text-sm text-muted-foreground">No results for &ldquo;{search}&rdquo; — try a different spelling</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Selected tool header */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-muted/50 rounded-xl">
              {selectedTool.logo_url ? (
                <img src={selectedTool.logo_url} alt="" className="w-9 h-9 rounded-lg object-contain" />
              ) : (
                <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{selectedTool.name[0]}</span>
              )}
              <div className="flex-1">
                <p className="font-bold">{selectedTool.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tiers.some(t => t.tier_name.includes('~'))
                    ? 'How much do you typically use?'
                    : 'Select your plan below'}
                </p>
              </div>
              <button onClick={() => setSelectedTool(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Pricing tiers */}
            {tiersLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : tiers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                {tiers.map(tier => (
                  <button
                    key={tier.tier_name}
                    type="button"
                    onClick={() => addSub(tier.monthly_price)}
                    disabled={adding}
                    className="p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center cursor-pointer group"
                  >
                    <p className="text-xl font-black group-hover:text-primary transition-colors">
                      {tier.monthly_price === 0 ? 'Free' : `$${tier.monthly_price}`}
                    </p>
                    <p className="text-xs font-semibold mt-1">{tier.tier_name}</p>
                    {tier.monthly_price > 0 && <p className="text-[10px] text-muted-foreground">/month</p>}
                    {tier.features && <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">{tier.features}</p>}
                  </button>
                ))}
                {/* Custom amount */}
                <div className="p-4 rounded-xl border border-border">
                  <p className="text-xs font-semibold mb-2 text-center">Custom</p>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      placeholder="$"
                      value={customCost}
                      onChange={e => setCustomCost(e.target.value)}
                      className="h-9 text-sm"
                      min="0"
                      step="0.01"
                    />
                    <Button size="sm" className="h-9 px-2 shrink-0" onClick={() => { if (customCost) addSub(parseFloat(customCost)) }} disabled={!customCost || adding}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 text-center">/month</p>
                </div>
              </div>
            ) : (
              /* No tiers found, show generic input */
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="Monthly cost ($)"
                  value={customCost}
                  onChange={e => setCustomCost(e.target.value)}
                  className="flex-1"
                  min="0"
                  step="0.01"
                />
                <Button onClick={() => { if (customCost) addSub(parseFloat(customCost)) }} disabled={!customCost || adding}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add</>}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subscription list */}
      {subs.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <DollarSign className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-lg font-bold mb-1">No subscriptions tracked yet</p>
          <p className="text-sm text-muted-foreground">Search for an AI tool above to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map(sub => (
            <div key={sub.id} className="glass-card rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {sub.tools?.logo_url ? (
                  <img src={sub.tools.logo_url} alt="" className="w-10 h-10 object-contain" />
                ) : (
                  <span className="text-sm font-bold text-primary">{sub.tools?.name?.[0] || '?'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/tools/${sub.tools?.slug || ''}`} className="font-bold text-sm hover:text-primary transition-colors">
                  {sub.tools?.name || 'Unknown Tool'}
                </Link>
                <p className="text-xs text-muted-foreground">{sub.tools?.pricing_model || 'paid'}</p>
              </div>
              <p className="text-lg font-black shrink-0">
                {Number(sub.monthly_cost) === 0 ? 'Free' : `$${Number(sub.monthly_cost).toFixed(2)}`}
                {Number(sub.monthly_cost) > 0 && <span className="text-xs text-muted-foreground font-normal">/mo</span>}
              </p>
              <button onClick={() => removeSub(sub.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stack intelligence + savings report — powered by single /dashboard fetch */}
      {subs.length >= 2 && dashboardData && (
        <>
          <StackIntel data={dashboardData} />
          <SavingsReport data={dashboardData} />
        </>
      )}
      {subs.length >= 2 && dashboardLoading && (
        <div className="space-y-4">
          <div className="rounded-xl border border-foreground/[0.06] p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              <div className="h-2 w-48 bg-muted/60 animate-pulse rounded" />
            </div>
          </div>
          <div className="rounded-xl border border-foreground/[0.06] p-4 space-y-2">
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            <div className="h-2 w-full bg-muted/40 animate-pulse rounded" />
          </div>
        </div>
      )}

      {/* Stack optimizer — compare your stack vs an optimized one */}
      {subs.length >= 2 && (
        <StackOptimizer
          key={`opt-${subs.map(s => s.id).join(',')}`}
          currentTools={subs.map(s => ({
            name: s.tools?.name || '?',
            slug: s.tools?.slug || '',
            logo_url: s.tools?.logo_url || null,
            cost: Number(s.monthly_cost),
          }))}
        />
      )}

    </div>
  )
}
