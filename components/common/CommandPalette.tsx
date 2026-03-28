'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Layers, ArrowLeftRight, LineChart, BookOpen, Command } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { PRICING_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

type SearchResult = {
  id: string
  name: string
  slug: string
  tagline: string | null
  logo_url: string | null
  pricing_model: string | null
  category_name: string | null
}

const QUICK_LINKS = [
  { label: 'Browse Tools', href: '/tools', icon: Layers },
  { label: 'Compare', href: '/compare', icon: ArrowLeftRight },
  { label: 'Tracker', href: '/tracker', icon: LineChart },
  { label: 'Blog', href: '/blog', icon: BookOpen },
] as const

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const router = useRouter()

  // Total navigable items: results + quick links
  const totalItems = results.length + QUICK_LINKS.length

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      // Focus input after dialog animation
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const term = `%${q.trim()}%`
      const { data } = await supabase
        .from('tools')
        .select('id, name, slug, tagline, logo_url, pricing_model, categories:category_id(name)')
        .eq('status', 'published')
        .or(`name.ilike.${term},tagline.ilike.${term}`)
        .order('upvote_count', { ascending: false })
        .limit(8)

      type RawTool = {
        id: string
        name: string
        slug: string
        tagline: string | null
        logo_url: string | null
        pricing_model: string | null
        categories: { name: string } | null
      }

      const mapped: SearchResult[] = ((data ?? []) as RawTool[]).map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        tagline: t.tagline,
        logo_url: t.logo_url,
        pricing_model: t.pricing_model,
        category_name: t.categories?.name ?? null,
      }))
      setResults(mapped)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setSelectedIndex(0)
    clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  const navigateTo = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const handleSelect = (index: number) => {
    if (index < results.length) {
      navigateTo(`/tools/${results[index].slug}`)
    } else {
      const linkIndex = index - results.length
      navigateTo(QUICK_LINKS[linkIndex].href)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % totalItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (totalItems > 0) handleSelect(selectedIndex)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="!p-0 gap-0 max-w-xl sm:max-w-xl top-[30%] sm:top-[35%] bg-background/95 backdrop-blur-xl border-border/50"
      >
        <DialogTitle className="sr-only">Search tools</DialogTitle>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border/50">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tools..."
            className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 h-5 text-[10px] font-medium text-muted-foreground/70 bg-muted/60 rounded border border-border/50">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {/* Loading state */}
          {loading && results.length === 0 && query.trim() && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Searching…
            </div>
          )}

          {/* No results */}
          {!loading && query.trim() && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No tools found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Tool results */}
          {results.length > 0 && (
            <div className="px-2">
              <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Tools
              </p>
              {results.map((tool, i) => (
                <button
                  key={tool.id}
                  type="button"
                  data-selected={selectedIndex === i}
                  onClick={() => handleSelect(i)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={cn(
                    'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors duration-100 cursor-pointer',
                    selectedIndex === i
                      ? 'bg-primary/10 text-foreground'
                      : 'text-foreground/80 hover:bg-muted/50'
                  )}
                >
                  <div className="h-8 w-8 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {tool.logo_url ? (
                      <img src={tool.logo_url} alt="" className="h-8 w-8 object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-primary">{tool.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{tool.name}</span>
                      {tool.category_name && (
                        <span className="text-[10px] text-muted-foreground/60 truncate hidden sm:inline">
                          {tool.category_name}
                        </span>
                      )}
                    </div>
                    {tool.tagline && (
                      <p className="text-xs text-muted-foreground/60 truncate">{tool.tagline}</p>
                    )}
                  </div>
                  {tool.pricing_model && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {PRICING_LABELS[tool.pricing_model] ?? tool.pricing_model}
                    </Badge>
                  )}
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Quick links */}
          <div className="px-2 mt-1">
            {(results.length > 0 || query.trim()) && (
              <div className="border-t border-border/30 my-1" />
            )}
            <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Quick Links
            </p>
            {QUICK_LINKS.map((link, i) => {
              const itemIndex = results.length + i
              const Icon = link.icon
              return (
                <button
                  key={link.href}
                  type="button"
                  data-selected={selectedIndex === itemIndex}
                  onClick={() => handleSelect(itemIndex)}
                  onMouseEnter={() => setSelectedIndex(itemIndex)}
                  className={cn(
                    'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors duration-100 cursor-pointer',
                    selectedIndex === itemIndex
                      ? 'bg-primary/10 text-foreground'
                      : 'text-foreground/80 hover:bg-muted/50'
                  )}
                >
                  <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">{link.label}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 ml-auto shrink-0" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/30 text-[10px] text-muted-foreground/50">
          <span>↑↓ navigate · ↵ select · esc close</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Search icon button for mobile navbar */
export function CommandPaletteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Search tools"
      className="flex items-center justify-center h-11 w-11 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
    >
      <Search className="h-5 w-5" />
    </button>
  )
}
