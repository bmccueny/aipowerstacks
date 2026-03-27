'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ExternalLink, Share2, Copy, CheckCircle2,
  Twitter, Mail, Linkedin, ChevronRight, ChevronLeft
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { CompareHeader } from './CompareHeader'
import { CompareRow, SectionHeader, BoolVal, CELL_CN } from './CompareRow'
import type { ToolWithTags } from '@/lib/types'

const MAX_TOOLS = 4

interface CompareTableProps {
  tools: ToolWithTags[]
}

function labelize(value: string | null | undefined) {
  if (!value) return 'N/A'
  return value.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

/** Strip pricing/plan fragments from pricing_details, keeping only the description. */
function extractDescription(details: string | null | undefined): string | null {
  if (!details || details === 'N/A') return null
  // Remove fragments like "Free tier; paid from $20/month." or "From $19" or "$10/month."
  const cleaned = details
    .replace(/free\s*tier[;,.]?\s*/gi, '')
    .replace(/(paid\s+)?from\s+\$[\d,.]+\s*\/?\s*(mo(?:nth)?|yr|year|seat)?[;,.]?\s*/gi, '')
    .replace(/(starts?\s+at\s+)?\$[\d,.]+\s*\/?\s*(mo(?:nth)?|yr|year|seat)?\s*(\([^)]*\))?[;,.]?\s*/gi, '')
    .replace(/free[;,.]?\s*/gi, '')
    .replace(/freemium[;,.]?\s*/gi, '')
    .replace(/\s*[;,]\s*$/, '')
    .trim()
  return cleaned.length > 5 ? cleaned : null
}

function valuesDiffer(tools: ToolWithTags[], accessor: (t: ToolWithTags) => string | number | boolean | null | undefined): boolean {
  if (tools.length < 2) return false
  const vals = tools.map(t => { const v = accessor(t); return v == null ? '' : String(v) })
  return new Set(vals).size > 1
}

export function CompareTable({ tools }: CompareTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const slugs = tools.map(t => t.slug)
  const emptySlots = MAX_TOOLS - tools.length
  const [tiersByTool, setTiersByTool] = useState<Record<string, { tier_name: string; monthly_price: number }[]>>({})

  // Fetch pricing tiers for all compared tools
  useEffect(() => {
    Promise.all(
      tools.map(t =>
        fetch(`/api/tracker/tiers?tool_id=${t.id}`)
          .then(r => r.json())
          .then(d => ({ id: t.id, tiers: d.tiers || [] }))
          .catch(() => ({ id: t.id, tiers: [] }))
      )
    ).then(results => {
      const map: Record<string, { tier_name: string; monthly_price: number }[]> = {}
      for (const r of results) map[r.id] = r.tiers
      setTiersByTool(map)
    })
  }, [tools])

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

  const removeTool = useCallback((slug: string) => {
    const newSlugs = slugs.filter(s => s !== slug)
    const params = new URLSearchParams(searchParams.toString())
    if (newSlugs.length > 0) { params.set('tools', newSlugs.join(',')) } else { params.delete('tools') }
    router.push(`/compare?${params.toString()}`)
  }, [slugs, searchParams, router])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const share = useCallback((type: 'x' | 'linkedin' | 'email') => {
    const url = window.location.href
    const names = tools.map(t => t.name).join(' vs ')
    if (type === 'x') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Comparing AI tools: ${names}`)}&url=${encodeURIComponent(url)}`, '_blank')
    } else if (type === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
    } else {
      window.location.href = `mailto:?subject=${encodeURIComponent(`AI Tool Comparison: ${names}`)}&body=${encodeURIComponent(`Check out this comparison:\n\n${url}`)}`
    }
  }, [tools])

  const highestRatingIdx = tools.reduce((best, tool, idx) => {
    return tool.avg_rating > (tools[best]?.avg_rating ?? 0) ? idx : best
  }, 0)

  const d = {
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

  const e = emptySlots
  const scrollBtnCn = 'h-7 w-7 rounded-md border border-foreground/10 flex items-center justify-center transition-opacity'

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
          {tools.length} of {MAX_TOOLS} tools<span className="hidden sm:inline"> selected</span>
        </p>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 sm:hidden">
            <button onClick={() => scrollBy('left')} className={cn(scrollBtnCn, canScrollLeft ? 'opacity-100' : 'opacity-30 pointer-events-none')} aria-label="Scroll left">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => scrollBy('right')} className={cn(scrollBtnCn, canScrollRight ? 'opacity-100' : 'opacity-30 pointer-events-none')} aria-label="Scroll right">
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
              <DropdownMenuItem onClick={() => share('x')} className="gap-2 cursor-pointer text-xs"><Twitter className="h-3.5 w-3.5" /> X</DropdownMenuItem>
              <DropdownMenuItem onClick={() => share('linkedin')} className="gap-2 cursor-pointer text-xs"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</DropdownMenuItem>
              <DropdownMenuItem onClick={() => share('email')} className="gap-2 cursor-pointer text-xs"><Mail className="h-3.5 w-3.5" /> Email</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {canScrollLeft && <div className="absolute left-[110px] sm:hidden top-0 bottom-0 w-4 bg-gradient-to-r from-background/80 to-transparent z-20 pointer-events-none" />}
      {canScrollRight && <div className="absolute right-0 sm:hidden top-0 bottom-0 w-4 bg-gradient-to-l from-background/80 to-transparent z-20 pointer-events-none" />}

      <div className="border border-foreground/10 rounded-lg sm:rounded-xl overflow-hidden bg-background">
        <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full border-collapse">
            <CompareHeader tools={tools} slugs={slugs} emptySlots={e} highestRatingIdx={highestRatingIdx} onRemoveTool={removeTool} />
            <tbody>
              <SectionHeader label="Overview" maxTools={MAX_TOOLS} />
              <CompareRow label="Rating" emptySlots={e} diff={d.rating}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(CELL_CN, 'text-center')}>
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
              </CompareRow>
              <CompareRow label="Use Case" emptySlots={e} stripe diff={d.useCase}>
                {tools.map((tool) => (
                  <td key={tool.id} className={CELL_CN}>
                    <span className="text-[11px] sm:text-xs font-medium">{labelize(tool.use_case)}</span>
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Tagline" emptySlots={e}>
                {tools.map((tool) => (
                  <td key={tool.id} className={CELL_CN}>
                    <span className="text-[10px] sm:text-xs text-muted-foreground leading-snug line-clamp-3">{tool.tagline || 'N/A'}</span>
                  </td>
                ))}
              </CompareRow>

              <SectionHeader label="Pricing" maxTools={MAX_TOOLS} />
              <CompareRow label="Model" emptySlots={e} diff={d.pricing}>
                {tools.map((tool) => {
                  const label = PRICING_LABELS[tool.pricing_model as keyof typeof PRICING_LABELS] ?? 'Unknown'
                  const color = PRICING_BADGE_COLORS[tool.pricing_model as keyof typeof PRICING_BADGE_COLORS] ?? ''
                  return (
                    <td key={tool.id} className={CELL_CN}>
                      <Badge variant="outline" className={cn('text-[8px] sm:text-[10px] font-bold uppercase h-4 sm:h-5 px-1.5 border', color)}>{label}</Badge>
                    </td>
                  )
                })}
              </CompareRow>
              <CompareRow label="Details" emptySlots={e} stripe>
                {tools.map((tool) => {
                  const desc = extractDescription(tool.pricing_details)
                  return (
                    <td key={tool.id} className={CELL_CN}>
                      <span className="text-[10px] sm:text-xs text-muted-foreground leading-snug">
                        {desc ?? 'N/A'}
                      </span>
                    </td>
                  )
                })}
              </CompareRow>
              <CompareRow label="Plans" emptySlots={e}>
                {tools.map((tool) => {
                  const tiers = tiersByTool[tool.id] || []
                  return (
                    <td key={tool.id} className={CELL_CN}>
                      {tiers.length > 0 ? (
                        <div className="space-y-1">
                          {tiers.map(tier => (
                            <div key={tier.tier_name} className="flex items-center justify-between gap-2">
                              <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{tier.tier_name}</span>
                              <span className="text-[10px] sm:text-xs font-bold shrink-0">
                                {tier.monthly_price === 0 ? 'Free' : `$${tier.monthly_price}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40">No pricing data</span>
                      )}
                    </td>
                  )
                })}
              </CompareRow>
              <CompareRow label="Tags" emptySlots={e}>
                {tools.map((tool) => (
                  <td key={tool.id} className={CELL_CN}>
                    {(tool.pricing_tags?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tool.pricing_tags!.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-[8px] sm:text-[9px] font-bold h-4 sm:h-5 px-1">{tag}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">N/A</span>
                    )}
                  </td>
                ))}
              </CompareRow>

              <SectionHeader label="Features" maxTools={MAX_TOOLS} />
              <CompareRow label="AI Model" emptySlots={e} diff={d.model}>
                {tools.map((tool) => (
                  <td key={tool.id} className={CELL_CN}>
                    <span className="text-[10px] sm:text-xs font-medium">{tool.model_provider || 'Proprietary'}</span>
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Pros" emptySlots={e} stripe>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(CELL_CN, 'align-top')}>
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
              </CompareRow>
              <CompareRow label="Cons" emptySlots={e}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(CELL_CN, 'align-top')}>
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
              </CompareRow>
              <CompareRow label="API" emptySlots={e} stripe diff={d.api}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(CELL_CN, 'text-center')}><BoolVal val={tool.has_api} /></td>
                ))}
              </CompareRow>
              <CompareRow label="Mobile App" emptySlots={e} diff={d.mobile}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(CELL_CN, 'text-center')}><BoolVal val={tool.has_mobile_app} /></td>
                ))}
              </CompareRow>
              <CompareRow label="Open Source" emptySlots={e} stripe diff={d.oss}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(CELL_CN, 'text-center')}><BoolVal val={tool.is_open_source} /></td>
                ))}
              </CompareRow>
              <CompareRow label="Integrations" emptySlots={e}>
                {tools.map((tool) => (
                  <td key={tool.id} className={CELL_CN}>
                    {(tool.integrations?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tool.integrations!.slice(0, 4).map((int: string) => (
                          <Badge key={int} variant="secondary" className="text-[7px] sm:text-[9px] font-medium h-4 sm:h-5 px-1 sm:px-1.5">{labelize(int)}</Badge>
                        ))}
                        {tool.integrations!.length > 4 && (
                          <span className="text-[8px] text-muted-foreground font-bold">+{tool.integrations!.length - 4}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">None</span>
                    )}
                  </td>
                ))}
              </CompareRow>

              <SectionHeader label="Security & Privacy" maxTools={MAX_TOOLS} />
              <CompareRow label="Trains on Data" emptySlots={e} diff={d.trains}>
                {tools.map((tool) => (
                  <td key={tool.id} className={CELL_CN}>
                    {tool.trains_on_data ? (
                      <Badge variant="outline" className="text-[8px] sm:text-[10px] font-bold uppercase h-4 sm:h-5 px-1.5 border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">Yes</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[8px] sm:text-[10px] font-bold uppercase h-4 sm:h-5 px-1.5 border-emerald-400/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">No</Badge>
                    )}
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="SSO" emptySlots={e} stripe diff={d.sso}>
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(CELL_CN, 'text-center')}><BoolVal val={tool.has_sso} /></td>
                ))}
              </CompareRow>
              <CompareRow label="Certifications" emptySlots={e}>
                {tools.map((tool) => (
                  <td key={tool.id} className={CELL_CN}>
                    {(tool.security_certifications?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tool.security_certifications!.map((cert: string) => (
                          <Badge key={cert} variant="secondary" className="text-[7px] sm:text-[9px] font-medium h-4 sm:h-5 px-1 sm:px-1.5">{cert}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">None</span>
                    )}
                  </td>
                ))}
              </CompareRow>

              <SectionHeader label="Team" maxTools={MAX_TOOLS} />
              <CompareRow label="Best For" emptySlots={e} diff={d.team}>
                {tools.map((tool) => (
                  <td key={tool.id} className={CELL_CN}>
                    <span className="text-[10px] sm:text-xs font-medium">{labelize(tool.team_size) || 'Any size'}</span>
                  </td>
                ))}
              </CompareRow>

              <tr className="border-t-2 border-foreground/[0.08]">
                <td className={cn(
                  'w-[110px] min-w-[110px] sm:w-[170px] sm:min-w-[170px]',
                  'p-2.5 sm:p-4 border-r border-foreground/[0.06]',
                  'sticky left-0 z-10 bg-background'
                )} />
                {tools.map((tool) => (
                  <td key={tool.id} className={cn(CELL_CN, 'text-center')}>
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
                {Array.from({ length: e }).map((_, i) => (
                  <td key={`ea-${i}`} className={CELL_CN} />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {tools.length >= 2 && (
        <p className="text-[9px] text-muted-foreground/40 text-center mt-2 sm:hidden font-medium">
          Swipe to compare all tools
        </p>
      )}
    </div>
  )
}
