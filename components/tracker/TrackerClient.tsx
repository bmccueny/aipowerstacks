'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, DollarSign, TrendingUp, Loader2 } from 'lucide-react'
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
  pricing_details: string | null
  starting_price: number | null
}

const COMMON_TIERS: Record<string, { label: string; price: number }[]> = {
  chatgpt: [{ label: 'Free', price: 0 }, { label: 'Plus', price: 20 }, { label: 'Pro', price: 200 }],
  'claude-code': [{ label: 'Free', price: 0 }, { label: 'Pro', price: 20 }, { label: 'Max', price: 100 }],
  'cursor-editor': [{ label: 'Hobby', price: 0 }, { label: 'Pro', price: 20 }, { label: 'Business', price: 40 }],
  'midjourney-v7': [{ label: 'Basic', price: 10 }, { label: 'Standard', price: 30 }, { label: 'Pro', price: 60 }],
  'github-copilot': [{ label: 'Free', price: 0 }, { label: 'Pro', price: 10 }, { label: 'Business', price: 19 }],
  'perplexity-ai': [{ label: 'Free', price: 0 }, { label: 'Pro', price: 20 }],
  zapier: [{ label: 'Free', price: 0 }, { label: 'Starter', price: 20 }, { label: 'Professional', price: 49 }],
  grammarly: [{ label: 'Free', price: 0 }, { label: 'Premium', price: 12 }, { label: 'Business', price: 15 }],
  canva: [{ label: 'Free', price: 0 }, { label: 'Pro', price: 13 }, { label: 'Teams', price: 10 }],
  superhuman: [{ label: 'Growth', price: 25 }, { label: 'Starter', price: 30 }],
  suno: [{ label: 'Free', price: 0 }, { label: 'Pro', price: 10 }, { label: 'Premier', price: 30 }],
  'notion-ai': [{ label: 'Free', price: 0 }, { label: 'Plus', price: 10 }, { label: 'Business', price: 18 }],
  replit: [{ label: 'Free', price: 0 }, { label: 'Replit Core', price: 25 }],
  windsurf: [{ label: 'Free', price: 0 }, { label: 'Pro', price: 15 }],
  'jasper-brand-voice': [{ label: 'Creator', price: 49 }, { label: 'Pro', price: 69 }],
  'semrush-one': [{ label: 'Pro', price: 130 }, { label: 'Guru', price: 250 }],
}

function getDefaultTiers(tool: ToolOption): { label: string; price: number }[] {
  if (COMMON_TIERS[tool.slug]) return COMMON_TIERS[tool.slug]
  // Generate generic tiers from pricing model
  if (tool.pricing_model === 'free') return [{ label: 'Free', price: 0 }]
  if (tool.pricing_model === 'freemium') return [{ label: 'Free', price: 0 }, { label: 'Pro', price: 20 }, { label: 'Custom', price: -1 }]
  if (tool.pricing_model === 'paid') return [{ label: 'Starter', price: 10 }, { label: 'Pro', price: 20 }, { label: 'Custom', price: -1 }]
  if (tool.pricing_model === 'trial') return [{ label: 'Free Trial', price: 0 }, { label: 'Paid', price: 20 }, { label: 'Custom', price: -1 }]
  return [{ label: 'Custom', price: -1 }]
}

export function TrackerClient({ tools }: { tools: ToolOption[] }) {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedTool, setSelectedTool] = useState<ToolOption | null>(null)
  const [customCost, setCustomCost] = useState('')
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/tracker')
      .then(r => r.json())
      .then(d => { setSubs(d.subscriptions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addSub = async (toolId: string, price: number) => {
    if (price <= 0 && price !== 0) return
    setAdding(true)
    const res = await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_id: toolId, monthly_cost: price }),
    })
    if (res.ok) {
      const data = await (await fetch('/api/tracker')).json()
      setSubs(data.subscriptions || [])
      setSelectedTool(null)
      setSearch('')
      setCustomCost('')
      setDropdownOpen(false)
      toast.success('Subscription added')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to add')
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
    ? tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) && !alreadyTracked.has(t.id)).slice(0, 8)
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
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
          /* Step 1: Search and select tool */
          <div className="relative" ref={dropdownRef}>
            <Input
              placeholder="Search for a tool (e.g. ChatGPT, Cursor, Midjourney)..."
              value={search}
              onChange={e => { setSearch(e.target.value); setDropdownOpen(true) }}
              onFocus={() => { if (search.length > 1) setDropdownOpen(true) }}
              className="bg-background/60 border-foreground/[0.12]"
            />
            {dropdownOpen && filteredTools.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-xl shadow-xl max-h-72 overflow-y-auto p-1">
                {filteredTools.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTool(t)
                      setSearch('')
                      setDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    {t.logo_url ? (
                      <img src={t.logo_url} alt="" className="w-7 h-7 rounded object-contain" />
                    ) : (
                      <span className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{t.name[0]}</span>
                    )}
                    <div className="flex-1">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{t.pricing_model}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {search.length > 1 && filteredTools.length === 0 && dropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-xl shadow-xl p-4 text-center text-sm text-muted-foreground">
                No tools found for &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Pick a tier */
          <div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
              {selectedTool.logo_url ? (
                <img src={selectedTool.logo_url} alt="" className="w-8 h-8 rounded object-contain" />
              ) : (
                <span className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{selectedTool.name[0]}</span>
              )}
              <div className="flex-1">
                <p className="font-bold">{selectedTool.name}</p>
                <p className="text-xs text-muted-foreground">Select your plan</p>
              </div>
              <button onClick={() => setSelectedTool(null)} className="text-xs text-muted-foreground hover:text-foreground">
                Change tool
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {getDefaultTiers(selectedTool).map(tier => (
                tier.price >= 0 ? (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => addSub(selectedTool.id, tier.price)}
                    disabled={adding}
                    className="p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center cursor-pointer"
                  >
                    <p className="text-lg font-black">{tier.price === 0 ? 'Free' : `$${tier.price}`}</p>
                    <p className="text-xs text-muted-foreground">{tier.label}{tier.price > 0 ? '/mo' : ''}</p>
                  </button>
                ) : (
                  /* Custom price input */
                  <div key="custom" className="p-3 rounded-lg border border-border">
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="$"
                        value={customCost}
                        onChange={e => setCustomCost(e.target.value)}
                        className="h-8 text-sm bg-background border-foreground/[0.12]"
                        min="0"
                        step="0.01"
                      />
                      <Button
                        size="sm"
                        className="h-8 px-2 shrink-0"
                        onClick={() => { if (customCost) addSub(selectedTool.id, parseFloat(customCost)) }}
                        disabled={!customCost || adding}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">Custom/mo</p>
                  </div>
                )
              ))}
            </div>
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
              <button
                onClick={() => removeSub(sub.id)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
