'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { SavingsReport } from './SavingsReport'
import { StackOptimizer } from './StackOptimizer'
import { SpendChart } from './SpendChart'
import { ChangelogFeed } from './ChangelogFeed'
import { SwitchPrompt } from './SwitchPrompt'
import { TrackerCostSummary } from './TrackerCostSummary'
import { TrackerToolSearch } from './TrackerToolSearch'
import { TrackerPopularTools } from './TrackerPopularTools'
import { TrackerSubscriptionList } from './TrackerSubscriptionList'
import { BudgetBar } from './BudgetBar'
import { StackScore } from './StackScore'
import { ShareStackButton } from './ShareStackButton'
import { InsightsPanel } from './InsightsPanel'
import { BenchmarkCard } from './BenchmarkCard'
import { CohortInsights } from './CohortInsights'
import { AnnualSavingsCalc } from './AnnualSavingsCalc'
import { FreeTierDetector } from './FreeTierDetector'
import { ModelOverlap } from './ModelOverlap'

type Subscription = {
  id: string
  tool_id: string
  monthly_cost: number
  billing_cycle: string
  created_at: string
  is_usage_based?: boolean
  use_tags?: string[] | null
  tools: { name: string; slug: string; logo_url: string | null; pricing_model: string; use_case?: string | null; category_id?: string | null; is_supertools?: boolean | null; categories?: { name: string } | null } | null
}

type ToolOption = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  pricing_model: string
  category_id?: string | null
  use_case?: string | null
  is_supertools?: boolean | null
  categories?: { name: string } | null
}

type PopularTool = {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

import { INTENT_TAGS } from './constants'

const ANON_STORAGE_KEY = 'aips_tracker_anon'

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

export function TrackerClient({ tools, popularTools = [], autoAddSlug, importTools, isLoggedIn = false }: { tools: ToolOption[]; popularTools?: PopularTool[]; autoAddSlug?: string; importTools?: string; isLoggedIn?: boolean }) {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [anonSubs, setAnonSubs] = useState<Array<{ tool_id: string; monthly_cost: number; tool: ToolOption }>>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedTool, setSelectedTool] = useState<ToolOption | null>(null)
  const autoAddHandledRef = useRef(false)
  const importHandledRef = useRef(false)
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [switchPrompt, setSwitchPrompt] = useState<{ toolId: string; toolName: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const [priceTrends, setPriceTrends] = useState<Record<string, number>>({})
  const [clientLoggedIn, setClientLoggedIn] = useState(isLoggedIn)

  // Load subs: try API first (works if user has auth cookie), fall back to localStorage
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    fetch('/api/tracker', { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error('not authed')
        return r.json()
      })
      .then(d => {
        setSubs(d.subscriptions || [])
        setClientLoggedIn(true)
        setLoading(false)
      })
      .catch(() => {
        setClientLoggedIn(false)
        try {
          const stored = JSON.parse(localStorage.getItem(ANON_STORAGE_KEY) || '[]')
          setAnonSubs(stored.map((s: { tool_id: string; monthly_cost: number }) => {
            const tool = tools.find(t => t.id === s.tool_id)
            return tool ? { ...s, tool } : null
          }).filter((x: { tool_id: string; monthly_cost: number; tool: ToolOption } | null): x is { tool_id: string; monthly_cost: number; tool: ToolOption } => x != null))
        } catch { /* empty */ }
        setLoading(false)
      })
      .finally(() => clearTimeout(timeout))

    return () => { controller.abort(); clearTimeout(timeout) }
  }, [tools])

  // Auto-select tool from ?add= query param after subs load
  useEffect(() => {
    if (autoAddHandledRef.current || loading || !autoAddSlug) return
    autoAddHandledRef.current = true
    const alreadyTrackedSet = new Set(subs.map(s => s.tool_id))
    const match = tools.find(t => t.slug === autoAddSlug && !alreadyTrackedSet.has(t.id))
    if (match) {
      setSelectedTool(match)
    }
  }, [autoAddSlug, loading, subs, tools])

  // Bulk import tools from ?import=slug:price,slug:price (from homepage calculator)
  useEffect(() => {
    if (importHandledRef.current || loading || !importTools) return
    importHandledRef.current = true
    const allTracked = new Set([...subs.map(s => s.tool_id), ...anonSubs.map(s => s.tool_id)])
    const entries = importTools.split(',').map(entry => {
      const [slug, priceStr] = entry.split(':')
      return { slug, price: parseFloat(priceStr) || 0 }
    }).filter(e => e.slug)

    const toAdd = entries
      .map(e => ({ tool: tools.find(t => t.slug === e.slug), price: e.price }))
      .filter((e): e is { tool: ToolOption; price: number } => e.tool != null && !allTracked.has(e.tool.id))

    if (toAdd.length === 0) return

    if (!clientLoggedIn) {
      const newAnon = [...anonSubs, ...toAdd.map(({ tool, price }) => ({ tool_id: tool.id, monthly_cost: price, tool }))]
      setAnonSubs(newAnon)
      localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(newAnon.map(s => ({ tool_id: s.tool_id, monthly_cost: s.monthly_cost }))))
      toast.success(`Added ${toAdd.length} tools from your calculator`)
      return
    }

    setImporting(true)
    Promise.allSettled(
      toAdd.map(({ tool, price }) =>
        fetch('/api/tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool_id: tool.id, monthly_cost: price }),
        }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r })
      )
    ).then((results) => {
      const succeeded = results.filter(r => r.status === 'fulfilled').length
      fetch('/api/tracker')
        .then(r => r.json())
        .then(d => {
          setSubs(d.subscriptions || [])
          setImporting(false)
          if (succeeded === toAdd.length) {
            toast.success(`Added ${succeeded} subscriptions from your calculator`)
          } else if (succeeded > 0) {
            toast.success(`Added ${succeeded} of ${toAdd.length} subscriptions`)
          } else {
            toast.error('Failed to import subscriptions')
          }
        })
        .catch(() => setImporting(false))
    })
  }, [importTools, loading, subs, anonSubs, tools, clientLoggedIn])

  // Fetch price trends for tracked tools — only for tool_ids not already cached
  useEffect(() => {
    if (subs.length === 0) return
    const controller = new AbortController()
    const newSubs = subs.filter(s => !(s.tool_id in priceTrends))
    if (newSubs.length === 0) return

    Promise.allSettled(
      newSubs.map(s =>
        fetch(`/api/tracker/tiers?tool_id=${s.tool_id}`, { signal: controller.signal })
          .then(r => r.json())
          .then(d => {
            const tiers = d.tiers || []
            const currentTier = tiers.find((t: { monthly_price: number }) =>
              Math.abs(t.monthly_price - Number(s.monthly_cost)) < 0.5
            )
            if (currentTier) return null
            if (tiers.length > 0 && Number(s.monthly_cost) > 0) {
              const closest = tiers.reduce((best: { monthly_price: number } | null, t: { monthly_price: number }) =>
                !best || Math.abs(t.monthly_price - Number(s.monthly_cost)) < Math.abs(best.monthly_price - Number(s.monthly_cost)) ? t : best
              , null)
              if (closest && closest.monthly_price !== Number(s.monthly_cost)) {
                const diff = closest.monthly_price - Number(s.monthly_cost)
                return { tool_id: s.tool_id, change: Math.round((diff / Number(s.monthly_cost)) * 100) }
              }
            }
            return null
          })
          .catch(() => null)
      )
    ).then(results => {
      if (controller.signal.aborted) return
      const trends: Record<string, number> = {}
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          trends[r.value.tool_id] = r.value.change
        }
      }
      if (Object.keys(trends).length > 0) setPriceTrends(prev => ({ ...prev, ...trends }))
    })

    return () => controller.abort()
  }, [subs]) // eslint-disable-line react-hooks/exhaustive-deps

  // Single dashboard fetch
  const subsCount = subs.length
  useEffect(() => {
    if (subsCount < 2) { setDashboardData(null); return }
    setDashboardLoading(true)
    fetch('/api/tracker/dashboard')
      .then(r => {
        if (!r.ok) throw new Error(`Dashboard ${r.status}`)
        return r.json()
      })
      .then(d => { setDashboardData(d.dashboard || null); setDashboardLoading(false) })
      .catch(() => {
        setDashboardData(null)
        setDashboardLoading(false)
      })
  }, [subsCount])

  const addSub = useCallback(async (price: number, intents: string[] = []) => {
    if (!selectedTool || price < 0) return
    setAdding(true)

    if (!clientLoggedIn) {
      const newAnon = [...anonSubs, { tool_id: selectedTool.id, monthly_cost: price, tool: selectedTool }]
      setAnonSubs(newAnon)
      localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(newAnon.map(s => ({ tool_id: s.tool_id, monthly_cost: s.monthly_cost }))))
      setSelectedTool(null)
      toast.success('Subscription added')
      setAdding(false)
      return
    }

    const toolId = selectedTool.id
    const res = await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_id: toolId, monthly_cost: price, use_tags: intents.length > 0 ? intents : undefined }),
    })
    if (res.ok) {
      try {
        const refreshRes = await fetch('/api/tracker')
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          setSubs(data.subscriptions || [])
        }
      } catch { /* refresh failed, sub was still added */ }
      setSelectedTool(null)
      toast.success('Subscription added')
    } else {
      toast.error('Failed to add')
    }
    setAdding(false)
  }, [selectedTool, clientLoggedIn, anonSubs])

  const removeSub = useCallback(async (id: string) => {
    // Check if this is an anon sub (passed as tool_id from the anon list)
    const isAnonSub = anonSubs.some(s => s.tool_id === id)
    if (isAnonSub) {
      const newAnon = anonSubs.filter(s => s.tool_id !== id)
      setAnonSubs(newAnon)
      localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(newAnon.map(s => ({ tool_id: s.tool_id, monthly_cost: s.monthly_cost }))))
      toast.success('Removed')
      return
    }
    const removedSub = subs.find(s => s.id === id)
    const removedName = removedSub?.tools?.name || null
    const removedToolId = removedSub?.tool_id || null

    const res = await fetch(`/api/tracker?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSubs(prev => prev.filter(s => s.id !== id))
      toast.success('Removed')
      if (removedName && removedToolId && subs.length >= 3) {
        setSwitchPrompt({ toolId: removedToolId, toolName: removedName })
      }
    }
  }, [anonSubs, subs])

  const updateSubCost = useCallback(async (subId: string, newCost: number) => {
    const sub = subs.find(s => s.id === subId)
    if (!sub) return
    const res = await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_id: sub.tool_id, monthly_cost: newCost }),
    })
    if (res.ok) {
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, monthly_cost: newCost } : s))
      toast.success('Tier updated')
    }
  }, [subs])

  const quickAdd = useCallback((tool: PopularTool) => {
    const match = tools.find(t => t.id === tool.id)
    if (match) setSelectedTool(match)
  }, [tools])

  // Merge authenticated and anonymous subs for display
  const effectiveSubs = clientLoggedIn ? subs : []
  const anonTotal = anonSubs.reduce((sum, s) => sum + s.monthly_cost, 0)
  const total = effectiveSubs.reduce((sum, s) => sum + Number(s.monthly_cost), 0) + anonTotal
  const yearly = total * 12
  const allToolIds = new Set([...subs.map(s => s.tool_id), ...anonSubs.map(s => s.tool_id)])
  const alreadyTracked = allToolIds
  const effectiveCount = effectiveSubs.length + anonSubs.length

  // Key that changes when tool list changes — forces analysis components to re-fetch
  const stackKey = [...subs.map(s => s.tool_id), ...anonSubs.map(s => s.tool_id)].sort().join(',')
  const anonToolData = anonSubs.map(s => ({ tool_id: s.tool_id, monthly_cost: s.monthly_cost }))

  // Compute overlaps — works for both logged-in subs and anonymous subs
  type OverlapItem = { tool_id: string; monthly_cost: number; is_usage_based?: boolean; use_tags?: string[] | null; tools: { name: string; slug: string; category_id?: string | null; use_case?: string | null; is_supertools?: boolean | null; categories?: { name: string } | null } | null }
  const overlaps = (() => {
    // Merge both sources into a unified shape
    const allItems: OverlapItem[] = [
      ...subs.map(s => ({ tool_id: s.tool_id, monthly_cost: Number(s.monthly_cost), is_usage_based: s.is_usage_based, use_tags: s.use_tags, tools: s.tools })),
      ...anonSubs.map(s => ({ tool_id: s.tool_id, monthly_cost: s.monthly_cost, is_usage_based: false, use_tags: null as string[] | null, tools: s.tool ? { name: s.tool.name, slug: s.tool.slug, category_id: s.tool.category_id, use_case: s.tool.use_case, is_supertools: s.tool.is_supertools, categories: s.tool.categories } : null })),
    ]
    if (allItems.length < 2) return []

    const fixedItems = allItems.filter(s => !s.is_usage_based && !s.tools?.is_supertools)
    const groups: Record<string, OverlapItem[]> = {}

    for (const sub of fixedItems) {
      const tags = sub.use_tags && sub.use_tags.length > 0 ? sub.use_tags : null

      if (tags) {
        for (const tag of tags) {
          const key = `intent::${tag}`
          if (!groups[key]) groups[key] = []
          groups[key].push(sub)
        }
      } else {
        const catId = sub.tools?.category_id
        if (!catId) continue
        const useCase = sub.tools?.use_case || 'general'
        const key = `cat::${catId}::${useCase}`
        if (!groups[key]) groups[key] = []
        groups[key].push(sub)
      }
    }

    const seen = new Set<string>()
    return Object.entries(groups)
      .filter(([, items]) => items.length >= 2 && items.some(s => Number(s.monthly_cost) > 0))
      .map(([groupKey, items]) => {
        const pairKey = items.map(s => s.tool_id).sort().join(',')
        if (seen.has(pairKey)) return null
        seen.add(pairKey)

        const isIntent = groupKey.startsWith('intent::')
        const tag = isIntent ? groupKey.split('::')[1] : null
        const intentLabel = tag ? (INTENT_TAGS.find(t => t.value === tag)?.label || tag) : null
        const categoryName = items[0].tools?.categories?.name
        const fallbackUseCase = groupKey.split('::').pop()
        const label = intentLabel
          || (fallbackUseCase && fallbackUseCase !== 'general' ? (USE_CASE_NAMES[fallbackUseCase] || fallbackUseCase) : null)
          || categoryName
          || 'Similar'

        return {
          useCase: groupKey,
          label,
          tools: items,
          totalCost: items.reduce((sum, s) => sum + Number(s.monthly_cost), 0),
        }
      })
      .filter(Boolean) as { useCase: string; label: string; tools: OverlapItem[]; totalCost: number }[]
  })()

  const overlapSavings = overlaps.reduce((sum, o) => {
    const costs = o.tools.map(t => Number(t.monthly_cost)).sort((a, b) => a - b)
    return sum + costs.slice(1).reduce((s, c) => s + c, 0)
  }, 0)

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Share button — shown for logged-in users with 2+ subs */}
      {clientLoggedIn && subsCount >= 2 && (
        <div className="flex justify-end">
          <ShareStackButton />
        </div>
      )}

      <TrackerCostSummary
        total={total}
        yearly={yearly}
        effectiveCount={effectiveCount}
        overlaps={overlaps}
        overlapSavings={overlapSavings}
        clientLoggedIn={clientLoggedIn}
        importing={importing}
      />

      {/* Budget tracking — shown for anyone with 1+ sub */}
      {effectiveCount >= 1 && (
        <BudgetBar totalSpend={total} isLoggedIn={clientLoggedIn} />
      )}

      {/* Add subscription */}
      <TrackerToolSearch
        tools={tools}
        alreadyTracked={alreadyTracked}
        onAddSub={addSub}
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        adding={adding}
      />

      {/* Quick-add popular tools */}
      {!selectedTool && popularTools.length > 0 && (
        <TrackerPopularTools
          popularTools={popularTools}
          alreadyTracked={alreadyTracked}
          onQuickAdd={quickAdd}
        />
      )}

      {/* Subscription list */}
      <TrackerSubscriptionList
        effectiveSubs={effectiveSubs}
        anonSubs={anonSubs}
        effectiveCount={effectiveCount}
        priceTrends={priceTrends}
        clientLoggedIn={clientLoggedIn}
        loading={loading}
        onRemoveSub={removeSub}
        onUpdateSubCost={updateSubCost}
      />

      {/* Cost Optimization — shown for anyone with 2+ tools */}
      {effectiveCount >= 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-black">Cost Optimization</h2>
          <AnnualSavingsCalc key={`asc-${stackKey}`} anonTools={!clientLoggedIn ? anonToolData : undefined} />
          <FreeTierDetector key={`ftd-${stackKey}`} anonTools={!clientLoggedIn ? anonToolData : undefined} />
        </div>
      )}

      {/* Stack score — shown for anyone with 2+ tools */}
      {effectiveCount >= 2 && <StackScore key={`ss-${stackKey}`} anonTools={!clientLoggedIn ? anonToolData : undefined} />}

      {/* Model intelligence — shown for anyone with 2+ tools */}
      {effectiveCount >= 2 && <ModelOverlap key={`mo-${stackKey}`} anonTools={!clientLoggedIn ? anonToolData : undefined} />}

      {/* Insights panel — shown for anyone with 1+ sub */}
      {effectiveCount >= 1 && (
        clientLoggedIn ? (
          <InsightsPanel
            subscriptions={subs.map(s => ({
              tool_id: s.tool_id,
              tools: s.tools ? { name: s.tools.name, slug: s.tools.slug } : null,
            }))}
          />
        ) : (
          <InsightsPanel anonToolIds={anonSubs.map(s => s.tool_id)} />
        )
      )}

      {/* Switch prompt — shown when user removes a tool */}
      {switchPrompt && (
        <SwitchPrompt
          removedToolId={switchPrompt.toolId}
          removedToolName={switchPrompt.toolName}
          recentlyAdded={subs.filter(s => s.tools?.name).slice(0, 3).map(s => ({ tool_id: s.tool_id, name: s.tools!.name }))}
          onClose={() => setSwitchPrompt(null)}
        />
      )}

      {/* Changelog feed — shown for anyone with 1+ sub */}
      {effectiveCount >= 1 && (
        <ChangelogFeed anonTools={!clientLoggedIn ? anonSubs.map(s => ({ tool_id: s.tool_id })) : undefined} />
      )}

      {/* Spend history chart */}
      {subsCount >= 2 && (
        <SpendChart subscriptions={subs.map(s => ({
          created_at: s.created_at,
          monthly_cost: Number(s.monthly_cost),
          tools: s.tools ? { name: s.tools.name } : null,
        }))} />
      )}

      {/* Savings report */}
      {subsCount >= 2 && dashboardData && (
        <SavingsReport data={dashboardData} />
      )}
      {subsCount >= 2 && !dashboardData && !dashboardLoading && clientLoggedIn && (
        <div className="rounded-xl border border-foreground/[0.06] p-5 text-center">
          <p className="text-sm text-muted-foreground">Analysis could not be loaded. Try refreshing the page.</p>
        </div>
      )}
      {subsCount >= 2 && dashboardLoading && (
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

      {/* Analytics section — shown for anyone with 2+ subs */}
      {effectiveCount >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BenchmarkCard anonTools={!clientLoggedIn ? anonToolData : undefined} />
          <CohortInsights anonTools={!clientLoggedIn ? anonSubs.map(s => ({ tool_id: s.tool_id })) : undefined} />
        </div>
      )}

      {/* Sign-up prompt for anonymous users — after all insights */}
      {!clientLoggedIn && effectiveCount >= 2 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center space-y-2">
          <p className="text-sm font-semibold">Want more insights?</p>
          <p className="text-xs text-muted-foreground">Sign up to save your stack, get personalized recommendations, and track pricing changes over time.</p>
          <a href="/register" className="inline-block mt-2 text-xs font-semibold text-primary hover:underline">Create free account →</a>
        </div>
      )}

      {/* Stack optimizer */}
      {subsCount >= 2 && (
        <div id="stack-optimizer">
        <StackOptimizer
          key={`opt-${subs.map(s => s.id).join(',')}`}
          currentTools={subs.map(s => ({
            name: s.tools?.name || '?',
            slug: s.tools?.slug || '',
            logo_url: s.tools?.logo_url || null,
            cost: Number(s.monthly_cost),
          }))}
        />
        </div>
      )}
    </div>
  )
}
