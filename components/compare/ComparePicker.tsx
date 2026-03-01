'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type PickerTool = {
  id: string
  name: string
  slug: string
  tagline?: string | null
}

const MAX_COMPARE_TOOLS = 3

export function ComparePicker({
  initialSelected,
  defaultSuggestions,
}: {
  initialSelected: PickerTool[]
  defaultSuggestions: PickerTool[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<PickerTool[]>(initialSelected.slice(0, MAX_COMPARE_TOOLS))
  const [results, setResults] = useState<PickerTool[]>(defaultSuggestions)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults(defaultSuggestions)
      setLoading(false)
      return
    }

    let cancelled = false
    const timeout = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/compare/search?q=${encodeURIComponent(trimmed)}&limit=8`, { cache: 'no-store' })
        if (!res.ok || cancelled) return
        const payload = await res.json() as { tools?: PickerTool[] }
        if (!cancelled) setResults(payload.tools ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [query, defaultSuggestions])

  const availableResults = useMemo(() => {
    const selectedIds = new Set(selected.map((tool) => tool.id))
    return results.filter((tool) => !selectedIds.has(tool.id)).slice(0, 8)
  }, [results, selected])

  const addTool = (tool: PickerTool) => {
    setSelected((prev) => {
      if (prev.some((item) => item.id === tool.id)) return prev
      if (prev.length >= MAX_COMPARE_TOOLS) return prev
      return [...prev, tool]
    })
    setQuery('')
  }

  const removeTool = (toolId: string) => {
    setSelected((prev) => prev.filter((tool) => tool.id !== toolId))
  }

  const startComparison = () => {
    if (selected.length < 2) return
    router.push(`/compare?tools=${encodeURIComponent(selected.map((tool) => tool.slug).join(','))}`)
  }

  return (
    <div className="rounded-[8px] border border-foreground/20 bg-background/60 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold">Pick 2-3 tools to compare</p>
        <p className="text-xs text-muted-foreground mt-1">
          Search by name and launch side-by-side comparison instantly.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools..."
          className="w-full rounded-[6px] border border-foreground/25 bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((tool) => (
            <Badge key={tool.id} variant="outline" className="inline-flex items-center gap-1.5 border-primary/40 bg-primary/5">
              <span>{tool.name}</span>
              <button
                type="button"
                onClick={() => removeTool(tool.id)}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${tool.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="rounded-[6px] border border-dashed border-foreground/20 bg-muted/20 p-2.5 min-h-16">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching tools...
          </div>
        ) : availableResults.length === 0 ? (
          <p className="text-xs text-muted-foreground">No matching tools. Try a different keyword.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {availableResults.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => addTool(tool)}
                disabled={selected.length >= MAX_COMPARE_TOOLS}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-primary/40 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {tool.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {selected.length < 2
            ? `Select ${2 - selected.length} more tool${selected.length === 0 ? 's' : ''} to compare.`
            : `Ready: ${selected.length} selected.`}
        </p>
        <Button size="sm" onClick={startComparison} disabled={selected.length < 2} className="gap-1.5">
          Compare Selected <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

