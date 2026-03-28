'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, DollarSign, TrendingDown, TrendingUp, Loader2, Search, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { SavingsReport } from './SavingsReport'
import { StackOptimizer } from './StackOptimizer'
import { StackIntel } from './StackIntel'
import { SpendChart } from './SpendChart'
import { UsageCheckin } from './UsageCheckin'
import { ChangelogFeed } from './ChangelogFeed'
import { BillingCalendar } from './BillingCalendar'
import { SwitchPrompt } from './SwitchPrompt'

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

type PopularTool = {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

const ANON_STORAGE_KEY = 'aips_tracker_anon'
const ANON_LIMIT = 3

const INTENT_TAGS = [
  { value: 'coding', label: 'Coding', icon: '⌨️' },
  { value: 'writing', label: 'Writing', icon: '✍️' },
  { value: 'research', label: 'Research', icon: '🔬' },
  { value: 'chat', label: 'Chat / Q&A', icon: '💬' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'marketing', label: 'Marketing', icon: '📈' },
  { value: 'video', label: 'Video / Audio', icon: '🎬' },
  { value: 'data', label: 'Data / Analytics', icon: '📊' },
]

const STARTER_BUNDLES = [
  { label: 'Developer Stack', icon: '⌨️', slugs: ['cursor-editor', 'claude-code', 'github-copilot'] },
  { label: 'Creator Stack', icon: '🎨', slugs: ['midjourney-v7', 'canva', 'elevenlabs-dubbing'] },
  { label: 'Marketer Stack', icon: '📈', slugs: ['jasper-brand-voice', 'copy-ai', 'semrush-one'] },
  { label: 'Researcher Stack', icon: '🔬', slugs: ['perplexity-ai', 'chatgpt', 'notebooklm'] },
]

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

export function TrackerClient({ tools, popularTools = [], autoAddSlug, importTools, isLoggedIn = false }: { tools: ToolOption[]; popularTools?: PopularTool[]; autoAddSlug?: string; importTools?: string; isLoggedIn?: boolean }) {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [anonSubs, setAnonSubs] = useState<Array<{ tool_id: string; monthly_cost: number; tool: ToolOption }>>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedTool, setSelectedTool] = useState<ToolOption | null>(null)
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [tiersLoading, setTiersLoading] = useState(false)
  const [customCost, setCustomCost] = useState('')
  const [selectedIntents, setSelectedIntents] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [autoAddHandled, setAutoAddHandled] = useState(false)
  const [importHandled, setImportHandled] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [switchPrompt, setSwitchPrompt] = useState<{ toolId: string; toolName: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const [priceTrends, setPriceTrends] = useState<Record<string, number>>({})
  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [editTiers, setEditTiers] = useState<PricingTier[]>([])
  const [editTiersLoading, setEditTiersLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

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
        // Not logged in or request failed — use localStorage
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
    if (importHandled || loading || !importTools) return
    setImportHandled(true)
    const allTracked = new Set([...subs.map(s => s.tool_id), ...anonSubs.map(s => s.tool_id)])
    const entries = importTools.split(',').map(entry => {
      const [slug, priceStr] = entry.split(':')
      return { slug, price: parseFloat(priceStr) || 0 }
    }).filter(e => e.slug)

    const toAdd = entries
      .map(e => ({ tool: tools.find(t => t.slug === e.slug), price: e.price }))
      .filter((e): e is { tool: ToolOption; price: number } => e.tool != null && !allTracked.has(e.tool.id))

    if (toAdd.length === 0) return

    // Anonymous: store in localStorage directly
    if (!clientLoggedIn) {
      const newAnon = [...anonSubs, ...toAdd.map(({ tool, price }) => ({ tool_id: tool.id, monthly_cost: price, tool }))]
      setAnonSubs(newAnon)
      localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(newAnon.map(s => ({ tool_id: s.tool_id, monthly_cost: s.monthly_cost }))))
      toast.success(`Added ${toAdd.length} tools from your calculator`)
      return
    }

    // Logged in: send to API
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
  }, [importTools, importHandled, loading, subs, anonSubs, tools, clientLoggedIn])

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

  // Fetch price trends for tracked tools
  useEffect(() => {
    if (subs.length === 0) return
    Promise.allSettled(
      subs.map(s =>
        fetch(`/api/tracker/tiers?tool_id=${s.tool_id}`)
          .then(r => r.json())
          .then(d => {
            const tiers = d.tiers || []
            const currentTier = tiers.find((t: { monthly_price: number }) =>
              Math.abs(t.monthly_price - Number(s.monthly_cost)) < 0.5
            )
            // If the tool has price history, the tool detail page shows trend
            // For now, check if user's cost doesn't match any current tier (price changed)
            if (currentTier) return null
            if (tiers.length > 0 && Number(s.monthly_cost) > 0) {
              // User's price doesn't match any tier — price likely changed
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
      const trends: Record<string, number> = {}
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          trends[r.value.tool_id] = r.value.change
        }
      }
      if (Object.keys(trends).length > 0) setPriceTrends(trends)
    })
  }, [subs])

  // Single dashboard fetch — replaces benchmark, report, stack-intel, analyze
  // Re-fetch when sub count changes (additions/deletions trigger this)
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

  const selectTool = (tool: ToolOption) => {
    setSelectedTool(tool)
    setSearch('')
    setShowDropdown(false)
  }

  const addSub = async (price: number) => {
    if (!selectedTool || price < 0) return
    setAdding(true)

    if (!clientLoggedIn) {
      // Anonymous mode: store in localStorage
      const newAnon = [...anonSubs, { tool_id: selectedTool.id, monthly_cost: price, tool: selectedTool }]
      setAnonSubs(newAnon)
      localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(newAnon.map(s => ({ tool_id: s.tool_id, monthly_cost: s.monthly_cost }))))
      setSelectedTool(null)
      setCustomCost('')
      setSelectedIntents([])
      toast.success('Subscription added')
      setAdding(false)
      return
    }

    const toolId = selectedTool.id
    const res = await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_id: toolId, monthly_cost: price, use_tags: selectedIntents.length > 0 ? selectedIntents : undefined }),
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
      setCustomCost('')
      setSelectedIntents([])
      toast.success('Subscription added')
    } else {
      toast.error('Failed to add')
    }
    setAdding(false)
  }

  const removeSub = async (id: string) => {
    if (!clientLoggedIn) {
      const newAnon = anonSubs.filter(s => s.tool_id !== id)
      setAnonSubs(newAnon)
      localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(newAnon.map(s => ({ tool_id: s.tool_id, monthly_cost: s.monthly_cost }))))
      toast.success('Removed')
      return
    }
    // Find tool name before removing
    const removedSub = subs.find(s => s.id === id)
    const removedName = removedSub?.tools?.name || null
    const removedToolId = removedSub?.tool_id || null

    const res = await fetch(`/api/tracker?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSubs(prev => prev.filter(s => s.id !== id))
      toast.success('Removed')
      // Show switch prompt if user has other recently added tools
      if (removedName && removedToolId && subs.length >= 3) {
        const recentOthers = subs
          .filter(s => s.id !== id && s.tools?.name)
          .slice(0, 3)
          .map(s => ({ tool_id: s.tool_id, name: s.tools!.name }))
        if (recentOthers.length > 0) {
          setSwitchPrompt({ toolId: removedToolId, toolName: removedName })
        }
      }
    }
  }

  const startEditTier = (subId: string, toolId: string) => {
    if (editingSubId === subId) { setEditingSubId(null); return }
    setEditingSubId(subId)
    setEditTiersLoading(true)
    fetch(`/api/tracker/tiers?tool_id=${toolId}`)
      .then(r => r.json())
      .then(d => { setEditTiers(d.tiers || []); setEditTiersLoading(false) })
      .catch(() => { setEditTiers([]); setEditTiersLoading(false) })
  }

  const updateSubCost = async (subId: string, newCost: number) => {
    const sub = subs.find(s => s.id === subId)
    if (!sub) return
    const res = await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_id: sub.tool_id, monthly_cost: newCost }),
    })
    if (res.ok) {
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, monthly_cost: newCost } : s))
      setEditingSubId(null)
      toast.success('Tier updated')
    }
  }

  // Quick-add a popular tool (select it for tier picking)
  const quickAdd = (tool: PopularTool) => {
    const match = tools.find(t => t.id === tool.id)
    if (match) setSelectedTool(match)
  }

  // Auto-add a tool with its default tier (fetch tiers, pick first paid)
  const autoAddTool = async (tool: ToolOption) => {
    try {
      const res = await fetch(`/api/tracker/tiers?tool_id=${tool.id}`)
      const d = await res.json()
      const tierList = d.tiers || []
      const paid = tierList.filter((t: { monthly_price: number }) => t.monthly_price > 0)
      const defaultTier = paid[0] || tierList[0]
      const price = defaultTier?.monthly_price ?? 0
      await addSub(price)
    } catch {
      // Fallback: add at $0
      await addSub(0)
    }
  }

  // Add all tools from a starter bundle — auto-add each with default tier
  const addBundle = async (slugs: string[]) => {
    const bundleTools = slugs
      .map(s => tools.find(t => t.slug === s))
      .filter((t): t is ToolOption => t != null && !alreadyTracked.has(t.id))
    if (bundleTools.length === 0) return
    toast.success(`Adding ${bundleTools.length} tools...`)
    for (const tool of bundleTools) {
      setSelectedTool(tool)
      await autoAddTool(tool)
    }
  }


  // Merge authenticated and anonymous subs for display
  const effectiveSubs = clientLoggedIn ? subs : []
  const anonTotal = anonSubs.reduce((sum, s) => sum + s.monthly_cost, 0)
  const total = effectiveSubs.reduce((sum, s) => sum + Number(s.monthly_cost), 0) + anonTotal
  const yearly = total * 12
  const allToolIds = new Set([...subs.map(s => s.tool_id), ...anonSubs.map(s => s.tool_id)])
  const alreadyTracked = allToolIds
  const effectiveCount = effectiveSubs.length + anonSubs.length

  const filteredTools = search.length > 1
    ? tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) && !alreadyTracked.has(t.id)).slice(0, 10)
    : []

  // Compute overlaps — group by intent tags (preferred) or category + use_case (fallback).
  // Intent tags catch overlaps like ChatGPT vs Claude that share "chat" intent
  // even if they're in different categories.
  const overlaps = subs.length >= 2 ? (() => {
    const fixedSubs = subs.filter(s => !s.is_usage_based)
    const groups: Record<string, Subscription[]> = {}

    for (const sub of fixedSubs) {
      const tags = sub.use_tags && sub.use_tags.length > 0 ? sub.use_tags : null

      if (tags) {
        // Intent-based grouping: each tag creates a group
        for (const tag of tags) {
          const key = `intent::${tag}`
          if (!groups[key]) groups[key] = []
          groups[key].push(sub)
        }
      } else {
        // Fallback: category + use_case grouping
        const catId = sub.tools?.category_id
        if (!catId) continue
        const useCase = sub.tools?.use_case || 'general'
        const key = `cat::${catId}::${useCase}`
        if (!groups[key]) groups[key] = []
        groups[key].push(sub)
      }
    }

    // Deduplicate: a tool pair may appear in multiple intent groups
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
      .filter(Boolean) as { useCase: string; label: string; tools: Subscription[]; totalCost: number }[]
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
      {effectiveCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-4xl sm:text-5xl font-black">${total.toFixed(0)}<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
            <p className="text-sm text-muted-foreground">${yearly.toFixed(0)}/yr · {effectiveCount} tool{effectiveCount !== 1 ? 's' : ''}{overlaps.length > 0 ? ` · ${overlaps.length} overlap${overlaps.length > 1 ? 's' : ''}` : ''}</p>
          </div>
          {overlapSavings > 0 && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] px-5 py-3 text-center shrink-0">
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">${(overlapSavings * 12).toFixed(0)}/yr</p>
              <p className="text-[10px] text-muted-foreground">potential savings</p>
            </div>
          )}
        </div>
      )}

      {/* Optimizer banner — surface early when savings detected */}
      {overlapSavings > 0 && effectiveCount >= 3 && clientLoggedIn && (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.04] to-emerald-500/[0.04] p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingDown className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">We found <span className="text-emerald-600 dark:text-emerald-400">${(overlapSavings * 12).toFixed(0)}/yr</span> in potential savings</p>
            <p className="text-xs text-muted-foreground">Let AI build your optimized stack</p>
          </div>
          <a href="#stack-optimizer" className="shrink-0">
            <Button size="sm" className="gap-1 text-xs font-bold">
              Optimize <ArrowRight className="h-3 w-3" />
            </Button>
          </a>
        </div>
      )}

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
                    onTouchEnd={(e) => { e.preventDefault(); selectTool(t) }}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-muted/80 active:bg-muted cursor-pointer border-b border-border/30 last:border-0 transition-colors"
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

      {/* Quick-add popular tools */}
      {!selectedTool && popularTools.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Popular tools — tap to add</p>
          <div className="flex flex-wrap gap-1.5">
            {popularTools.filter(t => !alreadyTracked.has(t.id)).slice(0, 12).map(t => (
              <button
                key={t.id}
                onClick={() => quickAdd(t)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-foreground/10 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-semibold"
              >
                {t.logo_url ? (
                  <img src={t.logo_url} alt="" className="w-4 h-4 rounded object-contain" />
                ) : (
                  <span className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">{t.name[0]}</span>
                )}
                {t.name}
                <Plus className="h-2.5 w-2.5 text-primary opacity-50" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subscription list */}
      {effectiveCount === 0 ? (
        <div className="glass-card rounded-xl p-8 sm:p-12 text-center">
          <DollarSign className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-lg font-bold mb-1">No subscriptions tracked yet</p>
          <p className="text-sm text-muted-foreground">Search for a tool above to get started</p>
        </div>
      ) : (
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
                      <img src={sub.tools.logo_url} alt="" className="w-10 h-10 object-contain" />
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
                  <button onClick={() => removeSub(sub.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1">
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
                        onClick={() => updateSubCost(sub.id, tier.monthly_price)}
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
                          onClick={() => updateSubCost(sub.id, p)}
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
                  <img src={sub.tool.logo_url} alt="" className="w-10 h-10 object-contain" />
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
              <button onClick={() => removeSub(sub.tool_id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1">
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

        {/* Save your stack CTA for anonymous users — only after loading completes */}
        {!loading && !clientLoggedIn && anonSubs.length > 0 && (
          <Link href={`/login?redirectTo=${encodeURIComponent('/tracker')}`} className="block">
            <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/[0.06] to-primary/[0.02] p-5 text-center hover:border-primary/50 transition-all cursor-pointer">
              <p className="text-sm font-bold text-primary mb-1">Save your stack &amp; unlock full analysis</p>
              <p className="text-xs text-muted-foreground">Sign in to access overlap detection, savings reports, and AI-powered optimization</p>
            </div>
          </Link>
        )}
        </>
      )}

      {/* Switch prompt — shown when user removes a tool */}
      {switchPrompt && clientLoggedIn && (
        <SwitchPrompt
          removedToolId={switchPrompt.toolId}
          removedToolName={switchPrompt.toolName}
          recentlyAdded={subs.filter(s => s.tools?.name).slice(0, 3).map(s => ({ tool_id: s.tool_id, name: s.tools!.name }))}
          onClose={() => setSwitchPrompt(null)}
        />
      )}

      {/* Weekly usage check-in */}
      {clientLoggedIn && subsCount >= 2 && (
        <UsageCheckin tools={subs.filter(s => Number(s.monthly_cost) > 0).map(s => ({
          tool_id: s.tool_id,
          name: s.tools?.name || '?',
          logo_url: s.tools?.logo_url || null,
          cost: Number(s.monthly_cost),
        }))} />
      )}

      {/* Billing calendar */}
      {clientLoggedIn && subsCount >= 1 && (
        <BillingCalendar subscriptions={subs.map(s => ({
          tool_id: s.tool_id,
          monthly_cost: Number(s.monthly_cost),
          created_at: s.created_at,
          tools: s.tools ? { name: s.tools.name, logo_url: s.tools.logo_url } : null,
        }))} />
      )}

      {/* Changelog feed */}
      {clientLoggedIn && subsCount >= 1 && <ChangelogFeed />}

      {/* Spend history chart */}
      {subsCount >= 2 && (
        <SpendChart subscriptions={subs.map(s => ({
          created_at: s.created_at,
          monthly_cost: Number(s.monthly_cost),
          tools: s.tools ? { name: s.tools.name } : null,
        }))} />
      )}

      {/* Stack intelligence + savings report — powered by single /dashboard fetch */}
      {subsCount >= 2 && dashboardData && (
        <>
          <StackIntel data={dashboardData} />
          <SavingsReport data={dashboardData} />
        </>
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

      {/* Stack optimizer — compare your stack vs an optimized one */}
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
