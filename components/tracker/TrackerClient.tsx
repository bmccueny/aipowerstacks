'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, DollarSign, TrendingUp, Loader2, Search, X } from 'lucide-react'
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
  tools: { name: string; slug: string; logo_url: string | null; pricing_model: string } | null
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

export function TrackerClient({ tools }: { tools: ToolOption[] }) {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedTool, setSelectedTool] = useState<ToolOption | null>(null)
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [tiersLoading, setTiersLoading] = useState(false)
  const [customCost, setCustomCost] = useState('')
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/tracker')
      .then(r => r.json())
      .then(d => { setSubs(d.subscriptions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

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

  const selectTool = (tool: ToolOption) => {
    setSelectedTool(tool)
    setSearch('')
    setShowDropdown(false)
  }

  const addSub = async (price: number) => {
    if (!selectedTool || price < 0) return
    setAdding(true)
    const res = await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_id: selectedTool.id, monthly_cost: price }),
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

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-8">
      {/* Cost summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-6 text-center">
          <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-3xl font-black">${total.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">per month</p>
        </div>
        <div className="glass-card rounded-xl p-6 text-center">
          <TrendingUp className="h-6 w-6 text-amber-500 mx-auto mb-2" />
          <p className="text-3xl font-black">${yearly.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-1">per year</p>
        </div>
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-3xl font-black">{subs.length}</p>
          <p className="text-xs text-muted-foreground mt-1">active subscriptions</p>
        </div>
      </div>

      {/* Add subscription */}
      <div className="glass-card rounded-xl p-6">
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
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-foreground/[0.12] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            {showDropdown && filteredTools.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-background border border-border rounded-xl shadow-2xl max-h-80 overflow-y-auto">
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
    </div>
  )
}
