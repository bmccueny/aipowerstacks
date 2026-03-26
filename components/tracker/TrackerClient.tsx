'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Loader2, Search, X, AlertTriangle, ArrowRight, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'

type Subscription = {
  id: string
  tool_id: string
  monthly_cost: number
  billing_cycle: string
  created_at: string
  tools: { name: string; slug: string; logo_url: string | null; pricing_model: string; use_case?: string | null; category_id?: string | null } | null
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

type Insight = {
  type: string
  title: string
  body: string
  action?: { label: string; href: string }
}

type Benchmark = {
  avgMonthly: number
  userCount: number
  percentile: number
  userTotal: number
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

export function TrackerClient({ tools, autoAddSlug }: { tools: ToolOption[]; autoAddSlug?: string }) {
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
  const [insights, setInsights] = useState<Record<string, Insight[]>>({})
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null)
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set())
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

  // Fetch benchmark when subs change
  const fetchBenchmark = useCallback(() => {
    if (subs.length === 0) { setBenchmark(null); return }
    fetch('/api/tracker/benchmark')
      .then(r => r.json())
      .then(d => setBenchmark(d))
      .catch(() => setBenchmark(null))
  }, [subs.length])

  useEffect(() => { fetchBenchmark() }, [fetchBenchmark])

  // Fetch insights for a specific tool after it's added
  const fetchInsights = (toolId: string) => {
    fetch(`/api/tracker/insights?tool_id=${toolId}`)
      .then(r => r.json())
      .then(d => {
        if (d.insights && d.insights.length > 0) {
          setInsights(prev => ({ ...prev, [toolId]: d.insights }))
          setExpandedInsights(prev => new Set(prev).add(toolId))
        }
      })
      .catch(() => {})
  }

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
      fetchInsights(toolId)
    } else {
      toast.error('Failed to add')
    }
    setAdding(false)
  }

  const removeSub = async (id: string, toolId: string) => {
    const res = await fetch(`/api/tracker?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSubs(prev => prev.filter(s => s.id !== id))
      setInsights(prev => {
        const next = { ...prev }
        delete next[toolId]
        return next
      })
      toast.success('Removed')
    }
  }

  const toggleInsights = (toolId: string) => {
    setExpandedInsights(prev => {
      const next = new Set(prev)
      if (next.has(toolId)) next.delete(toolId)
      else next.add(toolId)
      return next
    })
  }

  const total = subs.reduce((sum, s) => sum + Number(s.monthly_cost), 0)
  const yearly = total * 12
  const alreadyTracked = new Set(subs.map(s => s.tool_id))

  const filteredTools = search.length > 1
    ? tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) && !alreadyTracked.has(t.id)).slice(0, 10)
    : []

  // Compute overlaps — group by category_id (tightest match),
  // then label with use_case for display
  const overlaps = subs.length >= 2 ? (() => {
    const groups: Record<string, Subscription[]> = {}
    for (const sub of subs) {
      // Use category_id as primary grouper — tools in the same category
      // actually compete with each other (e.g. two code editors, two image generators)
      const key = sub.tools?.category_id
      if (!key) continue
      if (!groups[key]) groups[key] = []
      groups[key].push(sub)
    }
    return Object.entries(groups)
      .filter(([, items]) => items.length >= 2 && items.some(s => Number(s.monthly_cost) > 0))
      .map(([categoryId, items]) => {
        // Use the use_case label if all tools share one, otherwise describe generically
        const useCases = new Set(items.map(s => s.tools?.use_case).filter(Boolean))
        const sharedUseCase = useCases.size === 1 ? [...useCases][0] : null
        const label = sharedUseCase
          ? (USE_CASE_NAMES[sharedUseCase] || sharedUseCase)
          : `${items[0].tools?.name?.split(' ')[0] || 'Similar'}-category`
        return {
          useCase: categoryId,
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
      {/* Cost summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-5 text-center">
          <DollarSign className="h-5 w-5 text-primary mx-auto mb-1.5" />
          <p className="text-2xl font-black">${total.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">per month</p>
        </div>
        <div className="glass-card rounded-xl p-5 text-center">
          <TrendingUp className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
          <p className="text-2xl font-black">${yearly.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">per year</p>
        </div>
        <div className="glass-card rounded-xl p-5 text-center">
          <p className="text-2xl font-black">{subs.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">subscriptions</p>
        </div>
        {overlapSavings > 0 ? (
          <div className="rounded-xl p-5 text-center border border-emerald-400/20 bg-emerald-400/[0.04]">
            <TrendingDown className="h-5 w-5 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">${(overlapSavings * 12).toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">potential yearly savings</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-5 text-center">
            <p className="text-2xl font-black">$0</p>
            <p className="text-[10px] text-muted-foreground mt-1">overlap waste</p>
          </div>
        )}
      </div>

      {/* Benchmark bar */}
      {benchmark && subs.length >= 2 && (
        <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] px-5 py-3 flex items-center gap-3 text-sm">
          <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-muted-foreground">
            {benchmark.percentile >= 70 ? (
              <>You spend more than <strong className="text-foreground">{benchmark.percentile}%</strong> of tracked users. Average is <strong className="text-foreground">${benchmark.avgMonthly}/mo</strong>.</>
            ) : benchmark.percentile <= 30 ? (
              <>You spend less than <strong className="text-foreground">{100 - benchmark.percentile}%</strong> of tracked users. You&apos;re lean.</>
            ) : (
              <>Average AI spend across tracked users: <strong className="text-foreground">${benchmark.avgMonthly}/mo</strong>. You&apos;re at ${total.toFixed(0)}/mo.</>
            )}
          </p>
        </div>
      )}

      {/* Add subscription — z-20 so dropdown overlays the list below */}
      <div className="glass-card rounded-xl p-6 relative z-20">
        <h2 className="text-lg font-bold mb-4">Add a subscription</h2>

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
                <p className="text-xs text-muted-foreground">Select your plan below</p>
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

      {/* Overlap warnings — inline, prominent */}
      {overlaps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            We found overlap in your stack
          </h3>
          {overlaps.map(overlap => {
            const toolNames = overlap.tools.map(t => t.tools?.name).filter(Boolean)
            const cheapest = Math.min(...overlap.tools.map(t => Number(t.monthly_cost)))
            const savingsIfKeepOne = Math.round((overlap.totalCost - cheapest) * 12)
            return (
            <div key={overlap.useCase} className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4">
              <p className="text-sm font-bold mb-1">
                {overlap.tools.length} {overlap.label} tools — ${overlap.totalCost}/mo
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {toolNames.join(', ')} all do {overlap.label.toLowerCase()}. These tools directly compete with each other. Keeping just one saves <strong className="text-foreground">${savingsIfKeepOne}/year</strong>.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {overlap.tools.map(t => (
                  <span key={t.id} className="text-xs px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20 font-medium">
                    {t.tools?.name} · ${Number(t.monthly_cost)}/mo
                  </span>
                ))}
              </div>
              <Link
                href={`/compare?tools=${overlap.tools.map(t => t.tools?.slug).join(',')}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Compare side-by-side to decide <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            )
          })}
        </div>
      )}

      {/* Subscription list with inline insights */}
      {subs.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <DollarSign className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-lg font-bold mb-1">No subscriptions tracked yet</p>
          <p className="text-sm text-muted-foreground">Search for an AI tool above to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map(sub => {
            const toolInsights = insights[sub.tool_id]
            const isExpanded = expandedInsights.has(sub.tool_id)

            return (
              <div key={sub.id}>
                <div className="glass-card rounded-xl px-5 py-4 flex items-center gap-4">
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

                  {/* Insight toggle */}
                  {toolInsights && toolInsights.length > 0 && (
                    <button
                      onClick={() => toggleInsights(sub.tool_id)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
                    >
                      <Lightbulb className="h-3 w-3" />
                      {toolInsights.length} tip{toolInsights.length > 1 ? 's' : ''}
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  )}

                  <p className="text-lg font-black shrink-0">
                    {Number(sub.monthly_cost) === 0 ? 'Free' : `$${Number(sub.monthly_cost).toFixed(2)}`}
                    {Number(sub.monthly_cost) > 0 && <span className="text-xs text-muted-foreground font-normal">/mo</span>}
                  </p>
                  <button onClick={() => removeSub(sub.id, sub.tool_id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Inline insights panel */}
                {toolInsights && isExpanded && (
                  <div className="ml-14 mt-1 space-y-2 mb-2">
                    {toolInsights.map((insight, i) => (
                      <div
                        key={i}
                        className={`rounded-lg px-4 py-3 text-xs border ${
                          insight.type === 'cheaper_alternative'
                            ? 'border-emerald-400/20 bg-emerald-400/[0.04]'
                            : insight.type === 'tier_check'
                              ? 'border-amber-400/20 bg-amber-400/[0.04]'
                              : 'border-blue-400/20 bg-blue-400/[0.04]'
                        }`}
                      >
                        <p className="font-semibold mb-0.5">{insight.title}</p>
                        <p className="text-muted-foreground">{insight.body}</p>
                        {insight.action && (
                          <Link href={insight.action.href} className="inline-flex items-center gap-1 text-primary font-semibold hover:underline mt-1.5">
                            {insight.action.label} <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
