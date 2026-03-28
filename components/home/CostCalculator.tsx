'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { X, Search, ArrowRight, Check, Loader2, Terminal, Pen, Megaphone, FlaskConical } from 'lucide-react'

type QuickTool = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  pricing_model: string
}

type AddedTool = QuickTool & { price: number; tier: string }

// Curated popular tools shown in the tap grid — slug → default price
const POPULAR_SLUGS = [
  'chatgpt', 'claude-code', 'gemini', 'cursor-editor', 'midjourney',
  'perplexity-ai', 'github-copilot', 'grok', 'notion-ai', 'grammarly',
  'canva', 'jasper-brand-voice', 'windsurf', 'heygen', 'copy-ai',
  'descript-ai', 'suno', 'zapier', 'replit', 'bolt-new',
]

// Preset stacks
const PRESETS = [
  { label: 'Developer', icon: Terminal, color: 'text-emerald-500', slugs: ['chatgpt', 'claude-code', 'cursor-editor', 'github-copilot'] },
  { label: 'Creator', icon: Pen, color: 'text-violet-500', slugs: ['chatgpt', 'midjourney', 'canva', 'descript-ai'] },
  { label: 'Marketer', icon: Megaphone, color: 'text-amber-500', slugs: ['chatgpt', 'jasper-brand-voice', 'copy-ai', 'semrush-one'] },
  { label: 'Researcher', icon: FlaskConical, color: 'text-blue-500', slugs: ['chatgpt', 'perplexity-ai', 'gemini', 'notion-ai'] },
]

const SPEND_COMPARISONS = [
  { threshold: 50, text: 'a nice dinner out' },
  { threshold: 100, text: 'a gym membership' },
  { threshold: 200, text: 'a car payment' },
  { threshold: 500, text: 'a vacation flight' },
  { threshold: 1000, text: 'a new iPhone' },
  { threshold: 2000, text: 'a MacBook Air' },
  { threshold: 3000, text: 'a month of rent' },
  { threshold: 5000, text: 'a used car' },
]

function getComparison(yearly: number): string | null {
  for (let i = SPEND_COMPARISONS.length - 1; i >= 0; i--) {
    if (yearly >= SPEND_COMPARISONS[i].threshold) return SPEND_COMPARISONS[i].text
  }
  return null
}

export function CostCalculator({ tools, isLoggedIn }: { tools: QuickTool[]; isLoggedIn?: boolean }) {
  const [added, setAdded] = useState<AddedTool[]>([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedTool, setSelectedTool] = useState<QuickTool | null>(null)
  const [tiers, setTiers] = useState<{ tier_name: string; monthly_price: number }[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [editingTierId, setEditingTierId] = useState<string | null>(null)
  const [editTiers, setEditTiers] = useState<{ tier_name: string; monthly_price: number }[]>([])
  const [loadingToolId, setLoadingToolId] = useState<string | null>(null)
  const [tiersLoading, setTiersLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Build the popular tools grid from props
  const popularTools = POPULAR_SLUGS
    .map(slug => tools.find(t => t.slug === slug))
    .filter((t): t is QuickTool => t != null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load tiers when tool selected
  useEffect(() => {
    if (!selectedTool) { setTiers([]); return }
    setTiersLoading(true)
    fetch(`/api/tracker/tiers?tool_id=${selectedTool.id}`)
      .then(r => r.json())
      .then(d => { setTiers(d.tiers || []); setTiersLoading(false) })
      .catch(() => { setTiers([]); setTiersLoading(false) })
  }, [selectedTool])

  const addedIds = new Set(added.map(t => t.id))

  const filtered = search.length > 1
    ? tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) && !addedIds.has(t.id)).slice(0, 6)
    : []

  const selectTool = (tool: QuickTool) => {
    setSelectedTool(tool)
    setSearch('')
    setShowDropdown(false)
    setShowSearch(false)
  }

  const quickAdd = (tool: QuickTool) => {
    setLoadingToolId(tool.id)
    fetch(`/api/tracker/tiers?tool_id=${tool.id}`)
      .then(r => r.json())
      .then(d => {
        const tierList = d.tiers || []
        const paidTiers = tierList.filter((t: { monthly_price: number }) => t.monthly_price > 0)
        const defaultTier = paidTiers[0] || tierList[0]
        if (defaultTier) {
          setAdded(prev => [...prev, {
            ...tool,
            price: defaultTier.monthly_price,
            tier: defaultTier.tier_name,
          }])
        } else {
          selectTool(tool)
        }
        setLoadingToolId(null)
      })
      .catch(() => {
        selectTool(tool)
        setLoadingToolId(null)
      })
  }

  const addWithTier = (price: number, tierName: string) => {
    if (!selectedTool) return
    setAdded(prev => [...prev, { ...selectedTool, price, tier: tierName }])
    setSelectedTool(null)
  }

  const remove = (id: string) => {
    setAdded(prev => prev.filter(t => t.id !== id))
    if (editingTierId === id) setEditingTierId(null)
  }

  const startEditTier = (toolId: string) => {
    if (editingTierId === toolId) { setEditingTierId(null); return }
    setEditingTierId(toolId)
    const tool = added.find(t => t.id === toolId)
    if (!tool) return
    fetch(`/api/tracker/tiers?tool_id=${tool.id}`)
      .then(r => r.json())
      .then(d => setEditTiers(d.tiers || []))
      .catch(() => setEditTiers([]))
  }

  const changeTier = (toolId: string, price: number, tierName: string) => {
    setAdded(prev => prev.map(t => t.id === toolId ? { ...t, price, tier: tierName } : t))
    setEditingTierId(null)
  }

  const applyPreset = (preset: typeof PRESETS[number]) => {
    const presetTools = preset.slugs
      .map(slug => tools.find(t => t.slug === slug))
      .filter((t): t is QuickTool => t != null && !addedIds.has(t.id))

    // Quick-add all preset tools
    for (const tool of presetTools) {
      quickAdd(tool)
    }
  }

  const total = added.reduce((sum, t) => sum + t.price, 0)
  const yearly = total * 12
  const comparison = getComparison(yearly)

  return (
    <div className="max-w-xl mx-auto">
      {/* ── Preset shortcuts ── */}
      {added.length === 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          <span className="text-xs text-muted-foreground mr-1 self-center">I&apos;m a:</span>
          {PRESETS.map(preset => {
            const Icon = preset.icon
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-3.5 py-2 rounded-full border border-foreground/10 hover:border-primary/40 hover:bg-primary/5 text-sm transition-all cursor-pointer flex items-center gap-2 group"
              >
                <Icon className={`h-3.5 w-3.5 ${preset.color} group-hover:scale-110 transition-transform`} />
                <span className="font-semibold">{preset.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Tap-to-add grid ── */}
      {!selectedTool && !showSearch && (
        <div className="mb-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {popularTools.map(tool => {
              const isAdded = addedIds.has(tool.id)
              const isLoading = loadingToolId === tool.id
              return (
                <button
                  key={tool.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => isAdded ? remove(tool.id) : quickAdd(tool)}
                  className={`relative p-3 rounded-xl border transition-all text-center cursor-pointer group ${
                    isLoading
                      ? 'border-primary/30 bg-primary/[0.03] animate-pulse'
                      : isAdded
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-foreground/[0.06] hover:border-primary/30 hover:bg-primary/[0.02]'
                  }`}
                >
                  {isLoading && (
                    <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary/80 flex items-center justify-center">
                      <Loader2 className="h-2.5 w-2.5 text-white animate-spin" />
                    </div>
                  )}
                  {isAdded && !isLoading && (
                    <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  <div className={`h-10 w-10 mx-auto mb-1.5 flex items-center justify-center ${isLoading ? 'opacity-50' : ''}`}>
                    {tool.logo_url ? (
                      <img src={tool.logo_url} alt="" className="w-10 h-10 rounded-lg object-contain" />
                    ) : (
                      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{tool.name[0]}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium leading-tight line-clamp-1">{tool.name}</p>
                </button>
              )
            })}
          </div>

          {/* Search toggle */}
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="w-full mt-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
          >
            <Search className="h-3.5 w-3.5" /> Don&apos;t see your tool? Search
          </button>
        </div>
      )}

      {/* ── Search fallback ── */}
      {!selectedTool && showSearch && (
        <div ref={wrapperRef} className="relative mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search for any AI tool..."
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
              onFocus={() => { if (search.length > 1) setShowDropdown(true) }}
              autoFocus
              className="w-full pl-10 pr-10 py-3.5 text-base sm:text-sm rounded-2xl border border-foreground/[0.1] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              onClick={() => { setShowSearch(false); setSearch('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-lg"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          {showDropdown && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-white dark:bg-neutral-900 border border-border rounded-xl shadow-2xl max-h-64 overflow-y-auto">
              {filtered.map(t => (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onMouseDown={e => { e.preventDefault(); selectTool(t) }}
                  onTouchEnd={e => { e.preventDefault(); selectTool(t) }}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-muted/80 active:bg-muted cursor-pointer border-b border-border/20 last:border-0"
                >
                  {t.logo_url ? (
                    <img src={t.logo_url} alt="" className="w-7 h-7 rounded-lg object-contain shrink-0" />
                  ) : (
                    <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{t.name[0]}</span>
                  )}
                  <span className="font-medium text-sm flex-1">{t.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tier picker (when tool selected from search) ── */}
      {selectedTool && (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.02] p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            {selectedTool.logo_url ? (
              <img src={selectedTool.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{selectedTool.name[0]}</span>
            )}
            <span className="font-bold text-sm flex-1">{selectedTool.name}</span>
            <button onClick={() => setSelectedTool(null)} className="p-1 hover:bg-muted rounded-lg">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">What do you pay?</p>
          {tiersLoading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Loading plans...</span>
            </div>
          ) : (
          <div className="flex flex-wrap gap-2">
            {tiers.length > 0 ? tiers.map(tier => (
              <button
                key={tier.tier_name}
                type="button"
                onClick={() => addWithTier(tier.monthly_price, tier.tier_name)}
                className="px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-sm transition-all cursor-pointer"
              >
                <span className="font-bold">{tier.monthly_price === 0 ? 'Free' : `$${tier.monthly_price}`}</span>
                <span className="text-xs text-muted-foreground ml-1">{tier.tier_name}</span>
              </button>
            )) : (
              <div className="w-full">
                <p className="text-[10px] text-muted-foreground/60 mb-1.5">Estimated — exact plans not available</p>
                <div className="flex flex-wrap gap-2">
                  {[0, 10, 20, 50].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => addWithTier(p, p === 0 ? 'Free' : `$${p}/mo`)}
                      className="px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 text-sm font-bold transition-all cursor-pointer"
                    >
                      {p === 0 ? 'Free' : `~$${p}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* ── Receipt ── */}
      {added.length > 0 && (
        <div className="rounded-2xl border border-foreground/[0.06] divide-y divide-foreground/[0.06] mb-4">
          {added.map(tool => (
            <div key={tool.id}>
              <div className="flex items-center gap-3 px-4 py-2.5">
                {tool.logo_url ? (
                  <img src={tool.logo_url} alt="" className="w-6 h-6 rounded object-contain shrink-0" />
                ) : (
                  <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{tool.name[0]}</span>
                )}
                <span className="text-sm font-medium flex-1 truncate">{tool.name}</span>
                <button
                  onClick={() => startEditTier(tool.id)}
                  className="flex items-center gap-1.5 hover:bg-muted/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-xs text-muted-foreground">{tool.tier}</span>
                  <span className="text-sm font-bold">{tool.price === 0 ? 'Free' : `$${tool.price}`}</span>
                  <span className="text-[10px] text-primary">edit</span>
                </button>
                <button onClick={() => remove(tool.id)} className="p-0.5 hover:text-destructive transition-colors">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              {editingTierId === tool.id && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {editTiers.length > 0 ? editTiers.map(tier => (
                    <button
                      key={tier.tier_name}
                      type="button"
                      onClick={() => changeTier(tool.id, tier.monthly_price, tier.tier_name)}
                      className={`px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                        tool.tier === tier.tier_name
                          ? 'border-primary/40 bg-primary/10 font-bold'
                          : 'border-border hover:border-primary/30 hover:bg-primary/5'
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
                        onClick={() => changeTier(tool.id, p, p === 0 ? 'Free' : `$${p}/mo`)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          tool.price === p
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-border hover:border-primary/30 hover:bg-primary/5'
                        }`}
                      >
                        {p === 0 ? 'Free' : `$${p}`}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
          {/* Total */}
          <div className="flex items-center justify-between px-4 py-3 bg-foreground/[0.02]">
            <span className="text-sm font-bold">Monthly total</span>
            <span className="text-xl font-black">${total}<span className="text-sm text-muted-foreground font-normal">/mo</span></span>
          </div>
          <div className="flex items-center justify-between px-4 py-2 bg-foreground/[0.02]">
            <span className="text-xs text-muted-foreground">Annual cost</span>
            <span className="text-sm font-bold text-muted-foreground">${yearly}/year</span>
          </div>
        </div>
      )}

      {/* ── Reveal + CTA ── */}
      {added.length >= 2 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">
            {comparison
              ? <>That&apos;s <strong className="text-foreground">${yearly}/year</strong> — more than {comparison}.</>
              : <>That&apos;s <strong className="text-foreground">${yearly}/year</strong> on {added.length} AI tools.</>
            }
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            We&apos;ll show you which ones to cut.
          </p>
          <Link
            href={isLoggedIn
              ? `/tracker?import=${added.map(t => `${t.slug}:${t.price}`).join(',')}`
              : `/login?redirectTo=${encodeURIComponent(`/tracker?import=${added.map(t => `${t.slug}:${t.price}`).join(',')}`)}`
            }
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
          >
            Get My Savings Report
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {added.length === 0 && !showSearch && !selectedTool && (
        <p className="text-center text-xs text-muted-foreground">
          Tap the tools you pay for. See your total in seconds.
        </p>
      )}

      {added.length === 1 && (
        <p className="text-center text-xs text-muted-foreground animate-in fade-in">
          Add one more to see your full spend breakdown →
        </p>
      )}
    </div>
  )
}
