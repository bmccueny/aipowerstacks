'use client'

import { useState, useEffect } from 'react'
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
}

export function TrackerClient({ tools }: { tools: ToolOption[] }) {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedTool, setSelectedTool] = useState('')
  const [cost, setCost] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/tracker')
      .then(r => r.json())
      .then(d => { setSubs(d.subscriptions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const addSub = async () => {
    if (!selectedTool || !cost || parseFloat(cost) <= 0) return
    setAdding(true)
    const res = await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_id: selectedTool, monthly_cost: parseFloat(cost) }),
    })
    if (res.ok) {
      // Refresh list
      const data = await (await fetch('/api/tracker')).json()
      setSubs(data.subscriptions || [])
      setSelectedTool('')
      setCost('')
      setSearch('')
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

  const filteredTools = search.length > 0
    ? tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : []

  const alreadyTracked = new Set(subs.map(s => s.tool_id))

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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Search for a tool..."
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedTool('') }}
              className="bg-background/60 border-foreground/[0.12]"
            />
            {filteredTools.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 liquid-glass-dropdown p-1 max-h-60 overflow-y-auto">
                {filteredTools.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTool(t.id); setSearch(t.name) }}
                    disabled={alreadyTracked.has(t.id)}
                    className={`liquid-glass-dropdown-item w-full text-left px-3 py-2 text-sm flex items-center gap-3 ${alreadyTracked.has(t.id) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {t.logo_url ? (
                      <img src={t.logo_url} alt="" className="w-6 h-6 rounded object-contain" />
                    ) : (
                      <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{t.name[0]}</span>
                    )}
                    <span className="font-medium">{t.name}</span>
                    {alreadyTracked.has(t.id) && <span className="text-xs text-muted-foreground ml-auto">already tracked</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-32">
            <Input
              type="number"
              placeholder="$/month"
              value={cost}
              onChange={e => setCost(e.target.value)}
              min="0"
              step="0.01"
              className="bg-background/60 border-foreground/[0.12]"
            />
          </div>
          <Button onClick={addSub} disabled={!selectedTool || !cost || adding} className="shrink-0">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Add
          </Button>
        </div>
      </div>

      {/* Subscription list */}
      {subs.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <DollarSign className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-lg font-bold mb-1">No subscriptions tracked yet</p>
          <p className="text-sm text-muted-foreground">Search for an AI tool above and add your monthly cost</p>
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
              <p className="text-lg font-black shrink-0">${Number(sub.monthly_cost).toFixed(2)}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
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
