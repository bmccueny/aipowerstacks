'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { DollarSign, Plus, X, Search, ArrowRight } from 'lucide-react'

type QuickTool = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  pricing_model: string
}

type AddedTool = QuickTool & { price: number; tier: string }

export function CostCalculator({ tools }: { tools: QuickTool[] }) {
  const [added, setAdded] = useState<AddedTool[]>([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedTool, setSelectedTool] = useState<QuickTool | null>(null)
  const [tiers, setTiers] = useState<{ tier_name: string; monthly_price: number }[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)

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
    fetch(`/api/tracker/tiers?tool_id=${selectedTool.id}`)
      .then(r => r.json())
      .then(d => setTiers(d.tiers || []))
      .catch(() => setTiers([]))
  }, [selectedTool])

  const addedIds = new Set(added.map(t => t.id))

  const filtered = search.length > 1
    ? tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) && !addedIds.has(t.id)).slice(0, 6)
    : []

  const selectTool = (tool: QuickTool) => {
    setSelectedTool(tool)
    setSearch('')
    setShowDropdown(false)
  }

  const addWithTier = (price: number, tierName: string) => {
    if (!selectedTool) return
    setAdded(prev => [...prev, { ...selectedTool, price, tier: tierName }])
    setSelectedTool(null)
  }

  const remove = (id: string) => {
    setAdded(prev => prev.filter(t => t.id !== id))
  }

  const total = added.reduce((sum, t) => sum + t.price, 0)
  const yearly = total * 12

  return (
    <div className="max-w-xl mx-auto">
      {/* Search + add */}
      <div ref={wrapperRef} className="relative mb-4">
        {!selectedTool ? (
          <>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="What AI tools do you pay for?"
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
                onFocus={() => { if (search.length > 1) setShowDropdown(true) }}
                className="w-full pl-10 pr-4 py-3.5 text-sm rounded-2xl border border-foreground/[0.1] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            {showDropdown && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-background border border-border rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                {filtered.map(t => (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onMouseDown={e => { e.preventDefault(); selectTool(t) }}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-muted/80 cursor-pointer border-b border-border/20 last:border-0"
                  >
                    {t.logo_url ? (
                      <img src={t.logo_url} alt="" className="w-7 h-7 rounded-lg object-contain shrink-0" />
                    ) : (
                      <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{t.name[0]}</span>
                    )}
                    <span className="font-medium text-sm flex-1">{t.name}</span>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.02] p-4">
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
                <>
                  {[0, 10, 20, 50].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => addWithTier(p, p === 0 ? 'Free' : `$${p}/mo`)}
                      className="px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-sm font-bold transition-all cursor-pointer"
                    >
                      {p === 0 ? 'Free' : `$${p}`}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Receipt — running list */}
      {added.length > 0 && (
        <div className="rounded-2xl border border-foreground/[0.06] divide-y divide-foreground/[0.06] mb-4">
          {added.map(tool => (
            <div key={tool.id} className="flex items-center gap-3 px-4 py-2.5">
              {tool.logo_url ? (
                <img src={tool.logo_url} alt="" className="w-6 h-6 rounded object-contain shrink-0" />
              ) : (
                <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{tool.name[0]}</span>
              )}
              <span className="text-sm font-medium flex-1 truncate">{tool.name}</span>
              <span className="text-xs text-muted-foreground">{tool.tier}</span>
              <span className="text-sm font-bold w-16 text-right">{tool.price === 0 ? 'Free' : `$${tool.price}`}</span>
              <button onClick={() => remove(tool.id)} className="p-0.5 hover:text-destructive transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
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

      {/* CTA */}
      {added.length >= 2 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Thats <strong className="text-foreground">${yearly}/year</strong> on {added.length} tools. Want to find where youre overspending?
          </p>
          <Link
            href="/login?redirectTo=/tracker"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Save & Track Over Time
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {added.length === 0 && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Search for any tool. See your total AI spend in seconds.
        </p>
      )}
    </div>
  )
}
