'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ExternalLink, X, Share2, Copy, CheckCircle2,
  Twitter, Mail, Linkedin, Facebook, Plus, Search,
  Loader2, ChevronRight, ChevronLeft
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/reviews/StarRating'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const MAX_TOOLS = 4

interface CompareTableProps {
  tools: any[]
}

/* ─── Inline search for adding tools inside empty column ─── */
function InlineAddSearch({ currentSlugs }: { currentSlugs: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    let builder = supabase
      .from('tools')
      .select('id, name, slug, logo_url')
      .ilike('name', `%${q}%`)
      .eq('status', 'published')
    if (currentSlugs.length > 0) {
      builder = builder.not('slug', 'in', `(${currentSlugs.join(',')})`)
    }
    const { data } = await builder.limit(5)
    setResults(data ?? [])
    setLoading(false)
  }, [currentSlugs, supabase])

  const onInput = (val: string) => {
    setQuery(val)
    setOpen(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(val), 300)
  }

  const addTool = (slug: string) => {
    const newSlugs = [...currentSlugs, slug].slice(0, MAX_TOOLS)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tools', newSlugs.join(','))
    router.push(`/compare?${params.toString()}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => onInput(e.target.value)}
          onFocus={() => { if (query.length >= 2) setOpen(true) }}
          placeholder="Search..."
          className="w-full h-8 pl-7 pr-2 text-[11px] font-bold bg-background border border-foreground/15 rounded-md focus:outline-none focus:border-primary/50 transition-all"
        />
      </div>
      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-foreground/10 rounded-lg shadow-xl z-[60] max-h-48 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center"><Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-primary" /></div>
          ) : results.length > 0 ? (
            <div className="p-1">
              {results.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => addTool(tool.slug)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-primary/5 rounded text-left transition-colors"
                >
                  <div className="h-6 w-6 rounded bg-white border border-foreground/5 overflow-hidden flex items-center justify-center shrink-0">
                    {tool.logo_url ? (
                      <img src={tool.logo_url} alt={tool.name} className="object-contain w-full h-full p-0.5" />
                    ) : (
                      <span className="text-[8px] font-black text-primary">{tool.name[0]}</span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold truncate flex-1">{tool.name}</span>
                  <Plus className="h-3 w-3 text-primary shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2 text-center text-[10px] text-muted-foreground">No results</div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Difference detection ─── */
function valuesDiffer(tools: any[], accessor: (t: any) => string | number | boolean | null | undefined): boolean {
  if (tools.length < 2) return false
  const vals = tools.map(t => { const v = accessor(t); return v == null ? '' : String(v) })
  return new Set(vals).size > 1
}

/* ═══════════════════════════════════════════════════════
   CompareTable — PCPartPicker-style comparison matrix
   Mobile: horizontal swipe with sticky left label column
   ═══════════════════════════════════════════════════════ */
export function CompareTable({ tools }: CompareTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const slugs = tools.map(t => t.slug)
  const emptySlots = MAX_TOOLS - tools.length

  // Scroll indicators
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => {
      setCanScrollLeft(el.scrollLeft > 4)
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', check); ro.disconnect() }
  }, [tools.length])

  const scrollBy = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
  }

  const removeTool = (slug: string) => {
    const newSlugs = slugs.filter(s => s !== slug)
    const params = new URLSearchParams(searchParams.toString())
    if (newSlugs.length > 0) {
      params.set('tools', newSlugs.join(','))
    } else {
      params.delete('tools')
    }
    router.push(`/compare?${params.toString()}`)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareX = useCallback(() => {
    const text = `Comparing AI tools: ${tools.map(t => t.name).join(' vs ')}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank')
  }, [tools])

  const shareLinkedin = useCallback(() => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')
  }, [])

  const shareEmail = useCallback(() => {
    const subject = `AI Tool Comparison: ${tools.map(t => t.name).join(' vs ')}`
    const body = `Check out this comparison:\n\n${window.location.href}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [tools])

  const labelize = (value: string | null | undefined) => {
    if (!value) return 'N/A'
    return value.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }

  // Winner
  const highestRatingIdx = tools.reduce((best, tool, idx) => {
    return tool.avg_rating > (tools[best]?.avg_rating ?? 0) ? idx : best
  }, 0)

  // Diff flags
  const diffs = {
    rating: valuesDiffer(tools, t => t.avg_rating?.toFixed(1)),
    pricing: valuesDiffer(tools, t => t.pricing_model),
    useCase: valuesDiffer(tools, t => t.use_case),
    model: valuesDiffer(tools, t => t.model_provider),
    team: valuesDiffer(tools, t => t.team_size),
    api: valuesDiffer(tools, t => t.has_api),
    mobile: valuesDiffer(tools, t => t.has_mobile_app),
    oss: valuesDiffer(tools, t => t.is_open_source),
    trains: valuesDiffer(tools, t => t.trains_on_data),
    sso: valuesDiffer(tools, t => t.has_sso),
  }

  /* ── Boolean check/x ── */
  const BoolVal = ({ val }: { val: boolean }) => val ? (
    <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-500/10 text-emerald-600">
      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </span>
  ) : (
    <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-foreground/[0.03] text-foreground/20">
      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
    </span>
  )

  /* ── Spec row ── */
  const SpecRow = ({ label, children, stripe = false, diff = false }: {
    label: string
    children: React.ReactNode[]
    stripe?: boolean
    diff?: boolean
  }) => (
    <tr className={cn(
      'border-b border-foreground/[0.05]',
      stripe && 'bg-foreground/[0.015] dark:bg-foreground/[0.03]'
    )}>
      {/* Sticky label cell */}
      <td className={cn(
        // Sizing: compact on mobile, wider on desktop
        'w-[110px] min-w-[110px] sm:w-[170px] sm:min-w-[170px]',
        'px-3 py-2.5 sm:px-4 sm:py-3',
        'text-[10px] sm:text-xs font-bold uppercase tracking-wide text-muted-foreground',
        'border-r border-foreground/[0.06]',
        // Sticky left
        'sticky left-0 z-10',
        stripe
          ? 'bg-foreground/[0.015] dark:bg-foreground/[0.03]'
          : 'bg-background',
        diff && 'text-primary'
      )}>
        {label}
        {diff && <span className="inline-block h-1 w-1 rounded-full bg-amber-400 ml-1 align-super" />}
      </td>
      {children}
      {/* Empty slot placeholders */}
      {Array.from({ length: emptySlots }).map((_, i) => (
        <td key={`e-${i}`} className={cn(
          'min-w-[140px] sm:min-w-[180px] px-3 py-2.5 sm:px-4 sm:py-3',
          'border-r border-foreground/[0.06] last:border-r-0'
        )} />
      ))}
    </tr>
  )

  /* ── Section header ── */
  const SectionHeader = ({ label }: { label: string }) => (
    <tr>
      <td
        colSpan={MAX_TOOLS + 1}
        className="px-3 sm:px-4 py-2 bg-foreground/[0.04] dark:bg-foreground/[0.06] border-y border-foreground/[0.08] sticky left-0"
      >
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40">{label}</span>
      </td>
    </tr>
  )

  /* ── Tool cell className helper ── */
  const cellCn = 'min-w-[140px] sm:min-w-[180px] px-3 py-2.5 sm:px-4 sm:py-3 border-r border-foreground/[0.06] last:border-r-0'

  return (
    <div className="w-full relative">
      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
          {tools.length} of {MAX_TOOLS} tools
          <span className="hidden sm:inline"> selected</span>
        </p>
        <div className="flex items-center gap-1.5">
          {/* Mobile scroll arrows */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              onClick={() => scrollBy('left')}
              className={cn('h-7 w-7 rounded-md border border-foreground/10 flex items-center justify-center transition-opacity', canScrollLeft ? 'opacity-100' : 'opacity-30 pointer-events-none')}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => scrollBy('right')}
              className={cn('h-7 w-7 rounded-md border border-foreground/10 flex items-center justify-center transition-opacity', canScrollRight ? 'opacity-100' : 'opacity-30 pointer-events-none')}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 sm:h-8 gap-1 text-[10px] sm:text-xs font-bold text-muted-foreground px-2">
                <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="hidden sm:inline">Share</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={copyLink} className="gap-2 cursor-pointer text-xs">
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={shareX} className="gap-2 cursor-pointer text-xs">
                <Twitter className="h-3.5 w-3.5" /> X
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareLinkedin} className="gap-2 cursor-pointer text-xs">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareEmail} className="gap-2 cursor-pointer text-xs">
                <Mail className="h-3.5 w-3.5" /> Email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── Scroll fade indicators (mobile) ─── */}
      {canScrollLeft && (
        <div className="absolute left-[110px] sm:hidden top-0 bottom-0 w-4 bg-gradient-to-r from-background/80 to-transparent z-20 pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 sm:hidden top-0 bottom-0 w-4 bg-gradient-to-l from-background/80 to-transparent z-20 pointer-events-none" />
      )}

      {/* ─── Table container ─── */}
      <div className="border border-foreground/10 rounded-lg sm:rounded-xl overflow-hidden bg-background">
        <div
          ref={scrollRef}
          className="overflow-x-auto overscroll-x-contain scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <table className="w-full border-collapse">
            {/* ═══ PRODUCT HEADER ═══ */}
            <thead>
              <tr className="border-b-2 border-foreground/[0.08]">
                {/* Label column header */}
                <th className={cn(
                  'w-[110px] min-w-[110px] sm:w-[170px] sm:min-w-[170px]',
                  'p-2 sm:p-3 text-left align-bottom',
                  'border-r border-foreground/[0.06]',
                  'sticky left-0 z-30 bg-background'
                )}>
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/30">Specs</span>
                </th>

                {/* ── Tool columns ── */}
                {tools.map((tool, idx) => {
                  const isWinner = tools.length > 1 && idx === highestRatingIdx && tool.avg_rating > 0
                  return (
                    <th key={tool.id} className={cn(
                      'min-w-[140px] sm:min-w-[180px]',
                      'p-2.5 sm:p-4 text-center align-top relative group',
                      'border-r border-foreground/[0.06] last:border-r-0',
                      isWinner && 'bg-primary/[0.03]'
                    )}>
                      {/* Remove X */}
                      <button
                        onClick={() => removeTool(tool.slug)}
                        className="absolute top-1.5 right-1.5 h-5 w-5 sm:h-6 sm:w-6 rounded flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all sm:opacity-0 sm:group-hover:opacity-100 z-10"
                        title={`Remove ${tool.name}`}
                      >
                        <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </button>

                      {/* Winner badge */}
                      {isWinner && (
                        <div className="mb-1.5 sm:mb-2">
                          <Badge className="bg-primary text-white text-[7px] sm:text-[9px] font-black uppercase tracking-wider h-4 sm:h-5 px-1.5 sm:px-2 border-none">
                            Top Rated
                          </Badge>
                        </div>
                      )}

                      {/* Product image */}
                      <Link href={`/tools/${tool.slug}`} className="block mb-2 mx-auto">
                        <div className={cn(
                          'h-12 w-12 sm:h-16 sm:w-16 mx-auto rounded-lg sm:rounded-xl bg-white shadow-sm overflow-hidden flex items-center justify-center p-1.5 sm:p-2 border border-foreground/5 transition-transform hover:scale-105',
                          isWinner && 'ring-2 ring-primary/30'
                        )}>
                          {tool.logo_url ? (
                            <img src={tool.logo_url} alt={tool.name} className="object-contain w-full h-full" />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center font-black text-primary text-lg sm:text-2xl uppercase">
                              {tool.name[0]}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Product name */}
                      <Link href={`/tools/${tool.slug}`} className="hover:text-primary transition-colors">
                        <p className="font-black text-[11px] sm:text-sm leading-tight mb-0.5 line-clamp-2">{tool.name}</p>
                      </Link>

                      {/* Rating */}
                      {tool.review_count > 0 ? (
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          <StarRating rating={tool.avg_rating} size="sm" />
                          <span className="text-[8px] sm:text-[10px] font-bold text-muted-foreground">({tool.review_count})</span>
                        </div>
                      ) : (
                        <p className="text-[8px] sm:text-[10px] text-muted-foreground/40 font-bold mt-1">No reviews</p>
                      )}

                      {/* Pricing badge */}
                      <div className="mt-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[8px] sm:text-[10px] font-bold uppercase h-4 sm:h-5 px-1.5 border',
                            PRICING_BADGE_COLORS[tool.pricing_model as keyof typeof PRICING_BADGE_COLORS] ?? ''
                          )}
                        >
                          {PRICING_LABELS[tool.pricing_model as keyof typeof PRICING_LABELS] ?? 'Unknown'}
                        </Badge>
                      </div>
                    </th>
                  )
                })}

                {/* ── Empty "Add" slots ── */}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <th key={`add-${i}`} className={cn(
                    'min-w-[140px] sm:min-w-[180px]',
                    'p-2.5 sm:p-4 text-center align-middle',
                    'border-r border-foreground/[0.06] last:border-r-0'
                  )}>
                    <div className="flex flex-col items-center gap-2 py-2 sm:py-3">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl border-2 border-dashed border-foreground/10 flex items-center justify-center">
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-foreground/15" />
                      </div>
                      <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground/30 uppercase tracking-wider">Add Tool</p>
                      {i === 0 && (
                        <div className="w-full max-w-[150px]">
                          <InlineAddSearch currentSlugs={slugs} />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* ═══ OVERVIEW ═══ */}
              <SectionHeader label="Overview" />

              <SpecRow label="Rating" diff={diffs.rating}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(cellCn, 'text-center')}>
                    {tool.review_count > 0 ? (
                      <div>
                        <span className="text-base sm:text-lg font-black">{tool.avg_rating.toFixed(1)}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground"> / 5</span>
                      </div>
                    ) : (
                      <span className="text-[10px] sm:text-xs text-muted-foreground/40 italic">Unrated</span>
                    )}
                  </td>
                ))}
              </SpecRow>

              <SpecRow label="Use Case" stripe diff={diffs.useCase}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cellCn}>
                    <span className="text-[11px] sm:text-xs font-medium">{labelize(tool.use_case)}</span>
                  </td>
                ))}
              </SpecRow>

              <SpecRow label="Tagline">
                {tools.map((tool) => (
                  <td key={tool.id} className={cellCn}>
                    <span className="text-[10px] sm:text-xs text-muted-foreground leading-snug line-clamp-3">{tool.tagline || 'N/A'}</span>
                  </td>
                ))}
              </SpecRow>

              {/* ═══ PRICING ═══ */}
              <SectionHeader label="Pricing" />

              <SpecRow label="Model" diff={diffs.pricing}>
                {tools.map((tool) => {
                  const label = PRICING_LABELS[tool.pricing_model as keyof typeof PRICING_LABELS] ?? 'Unknown'
                  const color = PRICING_BADGE_COLORS[tool.pricing_model as keyof typeof PRICING_BADGE_COLORS] ?? ''
                  return (
                    <td key={tool.id} className={cellCn}>
                      <Badge variant="outline" className={cn('text-[8px] sm:text-[10px] font-bold uppercase h-4 sm:h-5 px-1.5 border', color)}>
                        {label}
                      </Badge>
                    </td>
                  )
                })}
              </SpecRow>

              <SpecRow label="Details" stripe>
                {tools.map((tool) => (
                  <td key={tool.id} className={cellCn}>
                    <span className="text-[10px] sm:text-xs text-muted-foreground leading-snug">
                      {tool.pricing_details && tool.pricing_details !== 'N/A' ? tool.pricing_details : 'N/A'}
                    </span>
                  </td>
                ))}
              </SpecRow>

              <SpecRow label="Tags">
                {tools.map((tool) => (
                  <td key={tool.id} className={cellCn}>
                    {tool.pricing_tags?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tool.pricing_tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-[8px] sm:text-[9px] font-bold h-4 sm:h-5 px-1">{tag}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">N/A</span>
                    )}
                  </td>
                ))}
              </SpecRow>

              {/* ═══ FEATURES ═══ */}
              <SectionHeader label="Features" />

              <SpecRow label="AI Model" diff={diffs.model}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cellCn}>
                    <span className="text-[10px] sm:text-xs font-medium">{tool.model_provider || 'Proprietary'}</span>
                  </td>
                ))}
              </SpecRow>

              <SpecRow label="Pros" stripe>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(cellCn, 'align-top')}>
                    <ul className="space-y-1">
                      {(tool.pros || []).slice(0, 3).map((pro: string, i: number) => (
                        <li key={i} className="text-[10px] sm:text-xs leading-snug flex items-start gap-1.5">
                          <span className="text-emerald-500 shrink-0 font-bold">+</span>
                          <span className="line-clamp-2">{pro}</span>
                        </li>
                      ))}
                      {(!tool.pros || tool.pros.length === 0) && (
                        <li className="text-[10px] text-muted-foreground/40 italic">No data</li>
                      )}
                    </ul>
                  </td>
                ))}
              </SpecRow>

              <SpecRow label="Cons">
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(cellCn, 'align-top')}>
                    <ul className="space-y-1">
                      {(tool.cons || []).slice(0, 3).map((con: string, i: number) => (
                        <li key={i} className="text-[10px] sm:text-xs leading-snug flex items-start gap-1.5">
                          <span className="text-red-400 shrink-0 font-bold">&ndash;</span>
                          <span className="line-clamp-2">{con}</span>
                        </li>
                      ))}
                      {(!tool.cons || tool.cons.length === 0) && (
                        <li className="text-[10px] text-muted-foreground/40 italic">No data</li>
                      )}
                    </ul>
                  </td>
                ))}
              </SpecRow>

              <SpecRow label="API" stripe diff={diffs.api}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(cellCn, 'text-center')}>
                    <BoolVal val={tool.has_api} />
                  </td>
                ))}
              </SpecRow>

              <SpecRow label="Mobile App" diff={diffs.mobile}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(cellCn, 'text-center')}>
                    <BoolVal val={tool.has_mobile_app} />
                  </td>
                ))}
              </SpecRow>

              <SpecRow label="Open Source" stripe diff={diffs.oss}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(cellCn, 'text-center')}>
                    <BoolVal val={tool.is_open_source} />
                  </td>
                ))}
              </SpecRow>

              <SpecRow label="Integrations">
                {tools.map((tool) => (
                  <td key={tool.id} className={cellCn}>
                    {tool.integrations?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tool.integrations.slice(0, 4).map((int: string) => (
                          <Badge key={int} variant="secondary" className="text-[7px] sm:text-[9px] font-medium h-4 sm:h-5 px-1 sm:px-1.5">{labelize(int)}</Badge>
                        ))}
                        {tool.integrations.length > 4 && (
                          <span className="text-[8px] text-muted-foreground font-bold">+{tool.integrations.length - 4}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">None</span>
                    )}
                  </td>
                ))}
              </SpecRow>

              {/* ═══ SECURITY ═══ */}
              <SectionHeader label="Security & Privacy" />

              <SpecRow label="Trains on Data" diff={diffs.trains}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cellCn}>
                    {tool.trains_on_data ? (
                      <Badge variant="outline" className="text-[8px] sm:text-[10px] font-bold uppercase h-4 sm:h-5 px-1.5 border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">Yes</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[8px] sm:text-[10px] font-bold uppercase h-4 sm:h-5 px-1.5 border-emerald-400/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">No</Badge>
                    )}
                  </td>
                ))}
              </SpecRow>

              <SpecRow label="SSO" stripe diff={diffs.sso}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(cellCn, 'text-center')}>
                    <BoolVal val={tool.has_sso} />
                  </td>
                ))}
              </SpecRow>

              <SpecRow label="Certifications">
                {tools.map((tool) => (
                  <td key={tool.id} className={cellCn}>
                    {tool.security_certifications?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tool.security_certifications.map((cert: string) => (
                          <Badge key={cert} variant="secondary" className="text-[7px] sm:text-[9px] font-medium h-4 sm:h-5 px-1 sm:px-1.5">{cert}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">None</span>
                    )}
                  </td>
                ))}
              </SpecRow>

              {/* ═══ TEAM ═══ */}
              <SectionHeader label="Team" />

              <SpecRow label="Best For" diff={diffs.team}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cellCn}>
                    <span className="text-[10px] sm:text-xs font-medium">{labelize(tool.team_size) || 'Any size'}</span>
                  </td>
                ))}
              </SpecRow>

              {/* ═══ ACTIONS ═══ */}
              <tr className="border-t-2 border-foreground/[0.08]">
                <td className={cn(
                  'w-[110px] min-w-[110px] sm:w-[170px] sm:min-w-[170px]',
                  'p-2.5 sm:p-4 border-r border-foreground/[0.06]',
                  'sticky left-0 z-10 bg-background'
                )} />
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(cellCn, 'text-center')}>
                    <div className="flex flex-col items-center gap-1.5">
                      <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="w-full max-w-[140px]">
                        <Button size="sm" className="w-full h-7 sm:h-8 gap-1 text-[10px] sm:text-xs font-bold btn-primary">
                          <ExternalLink className="h-3 w-3" /> Visit
                        </Button>
                      </a>
                      <Link href={`/tools/${tool.slug}`} className="text-[9px] sm:text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                        Details <ChevronRight className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  </td>
                ))}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <td key={`ea-${i}`} className={cellCn} />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile swipe hint */}
      {tools.length >= 2 && (
        <p className="text-[9px] text-muted-foreground/40 text-center mt-2 sm:hidden font-medium">
          Swipe to compare all tools
        </p>
      )}
    </div>
  )
}
