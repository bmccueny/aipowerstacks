'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { Search, X, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

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

import { INTENT_TAGS } from './constants'

type TrackerToolSearchProps = {
  tools: ToolOption[]
  alreadyTracked: Set<string>
  onAddSub: (price: number, intents: string[]) => Promise<void>
  selectedTool: ToolOption | null
  onSelectTool: (tool: ToolOption | null) => void
  adding: boolean
}

export function TrackerToolSearch({
  tools,
  alreadyTracked,
  onAddSub,
  selectedTool,
  onSelectTool,
  adding,
}: TrackerToolSearchProps) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [tiersLoading, setTiersLoading] = useState(false)
  const [customCost, setCustomCost] = useState('')
  const [selectedIntents, setSelectedIntents] = useState<string[]>([])
  const [reportingTier, setReportingTier] = useState<string | null>(null)
  const [reportPrice, setReportPrice] = useState('')
  const [reportUrl, setReportUrl] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

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
    onSelectTool(tool)
    setSearch('')
    setShowDropdown(false)
  }

  const handleAddSub = async (price: number) => {
    await onAddSub(price, selectedIntents)
    setCustomCost('')
    setSelectedIntents([])
  }

  const handleReportPrice = async (tierName: string) => {
    if (!selectedTool || !reportPrice) return
    setReportSubmitting(true)
    try {
      const res = await fetch('/api/tracker/report-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_id: selectedTool.id,
          tier_name: tierName,
          reported_price: parseFloat(reportPrice),
          actual_price_url: reportUrl || undefined,
        }),
      })
      if (res.ok) {
        toast.success("Thanks! We'll verify this soon.")
        setReportingTier(null)
        setReportPrice('')
        setReportUrl('')
      } else {
        toast.error('Failed to submit report. Please try again.')
      }
    } catch {
      toast.error('Failed to submit report. Please try again.')
    } finally {
      setReportSubmitting(false)
    }
  }

  const filteredTools = search.length > 1
    ? tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) && !alreadyTracked.has(t.id)).slice(0, 10)
    : []

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredTools.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx(prev => (prev + 1) % filteredTools.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx(prev => (prev <= 0 ? filteredTools.length - 1 : prev - 1))
    } else if (e.key === 'Enter' && highlightIdx >= 0 && highlightIdx < filteredTools.length) {
      e.preventDefault()
      selectTool(filteredTools[highlightIdx])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setHighlightIdx(-1)
    }
  }

  return (
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
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); setHighlightIdx(-1) }}
              onFocus={() => { if (search.length > 1) setShowDropdown(true) }}
              onKeyDown={handleSearchKeyDown}
              role="combobox"
              aria-expanded={showDropdown && filteredTools.length > 0}
              aria-controls="tool-search-listbox"
              aria-autocomplete="list"
              aria-activedescendant={highlightIdx >= 0 ? `tool-option-${highlightIdx}` : undefined}
              className="w-full pl-10 pr-4 py-3 text-base sm:text-sm rounded-xl border border-foreground/[0.12] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          {showDropdown && filteredTools.length > 0 && (
            <div id="tool-search-listbox" role="listbox" className="absolute top-full left-0 right-0 z-[100] mt-2 bg-white dark:bg-neutral-900 border border-border rounded-xl shadow-2xl max-h-80 overflow-y-auto">
              {filteredTools.map((t, idx) => (
                <div
                  key={t.id}
                  id={`tool-option-${idx}`}
                  role="option"
                  aria-selected={idx === highlightIdx}
                  onMouseDown={(e) => { e.preventDefault(); selectTool(t) }}
                  onTouchEnd={(e) => { e.preventDefault(); selectTool(t) }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`px-4 py-3 flex items-center gap-3 active:bg-muted cursor-pointer border-b border-border/30 last:border-0 transition-colors ${idx === highlightIdx ? 'bg-muted/80' : 'hover:bg-muted/80'}`}
                >
                  {t.logo_url ? (
                    <Image src={t.logo_url} alt={t.name} width={32} height={32} className="w-8 h-8 rounded-lg object-contain shrink-0" unoptimized />
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
              <Image src={selectedTool.logo_url} alt={selectedTool.name} width={36} height={36} className="w-9 h-9 rounded-lg object-contain" unoptimized />
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
            <button onClick={() => onSelectTool(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Pricing tiers */}
          {tiersLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : tiers.length > 0 ? (
            <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
              {tiers.map(tier => (
                <button
                  key={tier.tier_name}
                  type="button"
                  onClick={() => handleAddSub(tier.monthly_price)}
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
                  <Button size="sm" className="h-9 px-2 shrink-0" onClick={() => { if (customCost) handleAddSub(parseFloat(customCost)) }} disabled={!customCost || adding}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-center">/month</p>
              </div>
            </div>
            {/* Report wrong price */}
            <div className="mt-1">
              {reportingTier === null ? (
                <button
                  type="button"
                  onClick={() => setReportingTier(tiers[0]?.tier_name ?? '')}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Price wrong? Let us know
                </button>
              ) : (
                <div className="mt-2 p-3 rounded-xl border border-border bg-muted/30 space-y-2">
                  <p className="text-xs font-medium">Report incorrect price</p>
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={reportingTier}
                      onChange={e => setReportingTier(e.target.value)}
                      className="h-8 text-xs rounded-lg border border-border bg-background px-2 flex-1 min-w-0"
                    >
                      {tiers.map(t => (
                        <option key={t.tier_name} value={t.tier_name}>{t.tier_name}</option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      placeholder="Correct price ($)"
                      value={reportPrice}
                      onChange={e => setReportPrice(e.target.value)}
                      className="h-8 text-xs flex-1 min-w-[120px]"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <Input
                    type="url"
                    placeholder="Source URL (optional)"
                    value={reportUrl}
                    onChange={e => setReportUrl(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => handleReportPrice(reportingTier)}
                      disabled={!reportPrice || reportSubmitting}
                    >
                      {reportSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Submit'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setReportingTier(null); setReportPrice(''); setReportUrl('') }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            </>
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
              <Button onClick={() => { if (customCost) handleAddSub(parseFloat(customCost)) }} disabled={!customCost || adding}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add</>}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
