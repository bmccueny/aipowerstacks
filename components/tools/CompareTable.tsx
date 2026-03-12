'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ExternalLink, Check, X, Zap, ArrowRight, Share2,
  Copy, CheckCircle2, DollarSign, Star, ThumbsUp,
  Settings, Layers, Target, ShieldCheck, Twitter, Mail,
  Linkedin, Facebook, Brain, Users
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/reviews/StarRating'
import { AddToStackButton } from '@/components/tools/AddToStackButton'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'

interface CompareTableProps {
  tools: any[]
}

export function CompareTable({ tools }: CompareTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)

  const removeTool = (slug: string) => {
    const currentSlugs = tools.map(t => t.slug)
    const newSlugs = currentSlugs.filter(s => s !== slug)
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
    const text = `Check out this AI tool comparison on AIPowerStacks: ${tools.map(t => t.name).join(' vs ')}`
    const url = window.location.href
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  }, [tools])

  const shareLinkedin = useCallback(() => {
    const url = window.location.href
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
  }, [tools])

  const shareFacebook = useCallback(() => {
    const url = window.location.href
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }, [tools])

  const shareNotion = useCallback(() => {
    const text = `AI Tool Comparison: ${tools.map(t => t.name).join(' vs ')}\nLink: ${window.location.href}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [tools])

  const shareObsidian = useCallback(() => {
    const title = `AI Comparison - ${new Date().toLocaleDateString()}`
    const content = `# AI Tool Comparison\n\nGenerated from AIPowerStacks\n\n## Tools\n${tools.map(t => `- [[${t.name}]]`).join('\n')}\n\n[View Full Matrix](${window.location.href})`
    window.open(`obsidian://new?name=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`)
  }, [tools])

  const shareEmail = useCallback(() => {
    const subject = `AI Tool Comparison: ${tools.map(t => t.name).join(' vs ')}`
    const body = `I thought you might find this AI tool comparison useful:\n\n${window.location.href}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [tools])

  const labelize = (value: string | null | undefined) => {
    if (!value) return 'TBD'
    return value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  const LabelCell = ({ icon: Icon, label, colorClass }: { icon: any, label: string, colorClass?: string }) => (
    <td className="p-3 sm:p-4 bg-muted/20 border-r border-foreground/5 sticky left-0 z-20 backdrop-blur-sm text-center w-[72px] sm:w-[88px]">
      <div className="flex flex-col items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
        <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", colorClass || "text-muted-foreground")} />
        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-center leading-none">
          {label}
        </span>
      </div>
    </td>
  )

  // Section header row spanning all columns
  const SectionRow = ({ icon: Icon, label, colorClass }: { icon: any, label: string, colorClass?: string }) => (
    <tr>
      <td colSpan={tools.length + 1} className="px-4 py-2 bg-[var(--smoke,#eeede9)] dark:bg-muted/40 border-y border-foreground/10 sticky left-0">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-3.5 w-3.5", colorClass || "text-muted-foreground")} />
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        </div>
      </td>
    </tr>
  )

  // Determine which tool column has the highest rating (for winner highlight)
  const highestRatingIdx = tools.reduce((bestIdx, tool, idx) => {
    return tool.avg_rating > (tools[bestIdx]?.avg_rating ?? 0) ? idx : bestIdx
  }, 0)

  return (
    <div className="card-directory rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-foreground/15 bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-tighter">
            Matrix v2.0
          </Badge>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">
            Side-by-Side Analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-2 border-foreground/20 text-[10px] font-black uppercase tracking-widest px-3 hover:bg-background"
              >
                <Share2 className="h-3 w-3" /> Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50">Quick Copy</DropdownMenuLabel>
              <DropdownMenuItem onClick={copyLink} className="gap-3 cursor-pointer">
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                <span className="font-bold">{copied ? 'Link Copied' : 'Copy Matrix Link'}</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50">Save to Notes</DropdownMenuLabel>
              <DropdownMenuItem onClick={shareNotion} className="gap-3 cursor-pointer">
                <div className="h-4 w-4 shrink-0 rounded-lg overflow-hidden flex items-center justify-center glass-card border border-border/30">
                  <img src="https://www.google.com/s2/favicons?domain=notion.so&sz=32" alt="Notion logo" className="h-full w-full object-contain" />
                </div>
                <span className="font-bold">Copy for Notion</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareObsidian} className="gap-3 cursor-pointer">
                <div className="h-4 w-4 shrink-0 rounded-lg overflow-hidden flex items-center justify-center glass-card border border-border/30">
                  <img src="https://www.google.com/s2/favicons?domain=obsidian.md&sz=32" alt="Obsidian logo" className="h-full w-full object-contain" />
                </div>
                <span className="font-bold">Add to Obsidian</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50">Social</DropdownMenuLabel>
              <DropdownMenuItem onClick={shareX} className="gap-3 cursor-pointer">
                <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                <span className="font-bold">Share on X</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareLinkedin} className="gap-3 cursor-pointer">
                <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                <span className="font-bold">Share on LinkedIn</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareFacebook} className="gap-3 cursor-pointer">
                <Facebook className="h-4 w-4 text-[#1877F2]" />
                <span className="font-bold">Share on Facebook</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareEmail} className="gap-3 cursor-pointer">
                <Mail className="h-4 w-4 text-primary" />
                <span className="font-bold">Send Email</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="overflow-x-auto relative scrollbar-thin scrollbar-thumb-primary/20">
        <table className="w-full min-w-[600px] lg:min-w-full table-fixed border-separate border-spacing-0">
          <thead>
            <tr className="sticky top-0 z-20 shadow-sm" style={{ background: 'var(--smoke, #eeede9)' }}>
              <th className="p-4 w-[72px] sm:w-[88px] border-b border-r border-foreground/10 sticky left-0 z-30" style={{ background: 'var(--smoke, #eeede9)' }}>
                <div className="flex flex-col items-center gap-1 opacity-40">
                  <Settings className="h-4 w-4" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">Fields</span>
                </div>
              </th>
              {tools.map((tool, toolIdx) => {
                const isWinner = tools.length > 1 && toolIdx === highestRatingIdx && tool.avg_rating > 0
                return (
                  <th key={tool.id} className={cn(
                    "text-left p-4 sm:p-6 align-top group relative border-b border-foreground/10",
                    isWinner
                      ? "border-l-4 border-l-primary bg-primary/[0.04]"
                      : "bg-background/95"
                  )}>
                    {isWinner && (
                      <div className="absolute top-2 left-3 flex items-center gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                          Top Rated
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removeTool(tool.slug)}
                      className={cn(
                        "absolute top-2 right-2 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground border transition-all z-30",
                        "bg-background border-foreground/10 hover:bg-destructive hover:text-white hover:border-destructive",
                        "opacity-60 group-hover:opacity-100"
                      )}
                      title={`Remove ${tool.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className={cn("relative z-10", isWinner && "mt-5")}>
                      <Link href={`/tools/${tool.slug}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3 hover:opacity-80 transition-opacity">
                        <div className="h-10 w-10 sm:h-14 sm:w-14 shrink-0 rounded-xl border border-foreground/10 bg-white shadow-sm overflow-hidden flex items-center justify-center p-1.5">
                          {tool.logo_url ? (
                            <img src={tool.logo_url} alt={tool.name} className="object-contain w-full h-full" />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center font-black text-primary uppercase text-xl">
                              {tool.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-black tracking-tight text-[13px] sm:text-base lg:text-lg leading-[1.1] mb-1 group-hover:text-primary transition-colors line-clamp-2">
                            {tool.name}
                          </div>
                          {tool.is_supertools && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[7px] lg:text-[9px] font-black uppercase h-3.5 px-1 leading-none">
                              SuperTool
                            </Badge>
                          )}
                        </div>
                      </Link>
                      <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/70 hover:text-primary hover:underline transition-colors">
                        Specifications <ArrowRight className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/5 text-foreground">
            {/* ── Section: Overview ── */}
            <SectionRow icon={Star} label="Overview" colorClass="text-amber-500" />

            {/* Row: Rating */}
            <tr className="hover:bg-muted/30 transition-colors group">
              <LabelCell icon={Star} label="Stars" colorClass="text-amber-500" />
              {tools.map((tool, toolIdx) => {
                const isWinner = tools.length > 1 && toolIdx === highestRatingIdx && tool.avg_rating > 0
                return (
                  <td key={tool.id} className={cn("p-4 sm:p-5", isWinner && "border-l-4 border-l-primary bg-primary/[0.04]")}>
                    {tool.review_count > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <StarRating rating={tool.avg_rating} size="sm" />
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          {tool.avg_rating.toFixed(1)} <span className="font-normal opacity-50">/ 5.0</span>
                          <span className="ml-1 font-normal opacity-50">({tool.review_count})</span>
                        </p>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Unrated</span>
                    )}
                  </td>
                )
              })}
            </tr>

            {/* Row: Use Case */}
            <tr className="hover:bg-muted/30 transition-colors group">
              <LabelCell icon={Target} label="Fit" colorClass="text-primary" />
              {tools.map((tool, toolIdx) => {
                const isWinner = tools.length > 1 && toolIdx === highestRatingIdx && tool.avg_rating > 0
                return (
                  <td key={tool.id} className={cn("p-4 sm:p-5", isWinner && "border-l-4 border-l-primary bg-primary/[0.04]")}>
                    <div className="text-[11px] lg:text-[12px] font-medium leading-relaxed bg-muted/30 p-3 rounded-lg border border-foreground/5">
                      {labelize(tool.use_case)}
                    </div>
                  </td>
                )
              })}
            </tr>

            {/* ── Section: Pricing ── */}
            <SectionRow icon={DollarSign} label="Pricing" colorClass="text-emerald-600" />

            {/* Row: Billing */}
            <tr className="hover:bg-muted/30 transition-colors group">
              <LabelCell icon={DollarSign} label="Billing" colorClass="text-emerald-600 dark:text-emerald-400" />
              {tools.map((tool, toolIdx) => {
                const label = PRICING_LABELS[tool.pricing_model as keyof typeof PRICING_LABELS] ?? 'Unknown'
                const color = PRICING_BADGE_COLORS[tool.pricing_model as keyof typeof PRICING_BADGE_COLORS] ?? PRICING_BADGE_COLORS.unknown
                const isWinner = tools.length > 1 && toolIdx === highestRatingIdx && tool.avg_rating > 0
                return (
                  <td key={tool.id} className={cn("p-4 sm:p-5", isWinner && "border-l-4 border-l-primary bg-primary/[0.04]")}>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge variant="outline" className={cn("text-[10px] font-black uppercase px-2 h-6 border-2", color)}>
                        {label}
                      </Badge>
                      {tool.pricing_tags?.slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[9px] bg-stone-100 dark:bg-stone-800 text-foreground/70 border-none font-bold uppercase h-6 px-2">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {tool.pricing_details && tool.pricing_details !== 'N/A' && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-3">
                        {tool.pricing_details}
                      </p>
                    )}
                  </td>
                )
              })}
            </tr>

            {/* Row: Model Provider */}
            <tr className="hover:bg-muted/30 transition-colors group bg-muted/5">
              <LabelCell icon={Brain} label="Model" colorClass="text-violet-500" />
              {tools.map((tool, toolIdx) => {
                const isWinner = tools.length > 1 && toolIdx === highestRatingIdx && tool.avg_rating > 0
                return (
                  <td key={tool.id} className={cn("p-4 sm:p-5", isWinner && "border-l-4 border-l-primary bg-primary/[0.04]")}>
                    {tool.model_provider ? (
                      <Badge variant="secondary" className="text-[10px] font-black uppercase bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20 h-6 px-2.5">
                        {tool.model_provider}
                      </Badge>
                    ) : (
                      <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest italic">Proprietary</span>
                    )}
                  </td>
                )
              })}
            </tr>

            {/* ── Section: Features ── */}
            <SectionRow icon={ThumbsUp} label="Features" colorClass="text-emerald-500" />

            {/* Row: Pros */}
            <tr className="hover:bg-muted/30 transition-colors group">
              <LabelCell icon={ThumbsUp} label="Pros" colorClass="text-emerald-500" />
              {tools.map((tool, toolIdx) => {
                const isWinner = tools.length > 1 && toolIdx === highestRatingIdx && tool.avg_rating > 0
                return (
                  <td key={tool.id} className={cn("p-4 sm:p-5 align-top", isWinner && "border-l-4 border-l-primary bg-primary/[0.04]")}>
                    <ul className="space-y-2.5">
                      {(tool.pros || []).slice(0, 3).map((pro: string, i: number) => (
                        <li key={i} className="text-[11px] lg:text-[12px] leading-snug flex items-start gap-2.5 text-foreground/90">
                          <div className="h-4 w-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                            <Check className="h-2.5 w-2.5 text-emerald-600" />
                          </div>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                )
              })}
            </tr>

            {/* Row: Cons */}
            <tr className="hover:bg-muted/30 transition-colors group bg-red-50/5">
              <LabelCell icon={X} label="Cons" colorClass="text-red-500" />
              {tools.map((tool, toolIdx) => {
                const isWinner = tools.length > 1 && toolIdx === highestRatingIdx && tool.avg_rating > 0
                return (
                  <td key={tool.id} className={cn("p-4 sm:p-5 align-top", isWinner && "border-l-4 border-l-primary bg-primary/[0.04]")}>
                    <ul className="space-y-2.5">
                      {(tool.cons || []).slice(0, 3).map((con: string, i: number) => (
                        <li key={i} className="text-[11px] lg:text-[12px] leading-snug flex items-start gap-2.5 text-foreground/90">
                          <div className="h-4 w-4 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5 border border-red-500/20">
                            <X className="h-2.5 w-2.5 text-red-600" />
                          </div>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                )
              })}
            </tr>

            {/* ── Section: Security ── */}
            <SectionRow icon={ShieldCheck} label="Security & Privacy" colorClass="text-sky-500" />

            {/* Row: Privacy */}
            <tr className="hover:bg-muted/30 transition-colors group">
              <LabelCell icon={ShieldCheck} label="Privacy" colorClass="text-sky-500" />
              {tools.map((tool, toolIdx) => {
                const isWinner = tools.length > 1 && toolIdx === highestRatingIdx && tool.avg_rating > 0
                return (
                  <td key={tool.id} className={cn("p-4 sm:p-5", isWinner && "border-l-4 border-l-primary bg-primary/[0.04]")}>
                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/50 block mb-1.5">Data Training</span>
                        {tool.trains_on_data ? (
                          <Badge variant="outline" className="text-[9px] font-black uppercase border-amber-400/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 h-5 px-1.5">
                            Trains on data
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-black uppercase border-emerald-400/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 h-5 px-1.5">
                            Does not train
                          </Badge>
                        )}
                      </div>
                      {(tool.has_sso || (tool.security_certifications?.length > 0)) && (
                        <div className="flex flex-wrap gap-1.5">
                          {tool.has_sso && (
                            <Badge variant="secondary" className="text-[9px] font-black uppercase bg-sky-500/10 text-sky-700 dark:text-sky-400 border-none h-5 px-1.5">
                              SSO
                            </Badge>
                          )}
                          {tool.security_certifications?.map((cert: string) => (
                            <Badge key={cert} variant="secondary" className="text-[9px] font-black uppercase bg-slate-500/10 text-slate-600 dark:text-slate-400 border-none h-5 px-1.5">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>

            {/* ── Section: Community ── */}
            <SectionRow icon={Users} label="Community & Team" colorClass="text-indigo-500" />

            {/* Row: Team Size */}
            <tr className="hover:bg-muted/30 transition-colors group">
              <LabelCell icon={Users} label="Team" colorClass="text-indigo-500" />
              {tools.map((tool, toolIdx) => {
                const isWinner = tools.length > 1 && toolIdx === highestRatingIdx && tool.avg_rating > 0
                return (
                  <td key={tool.id} className={cn("p-4 sm:p-5", isWinner && "border-l-4 border-l-primary bg-primary/[0.04]")}>
                    {tool.team_size ? (
                      <Badge variant="secondary" className="text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 h-6 px-2.5">
                        {labelize(tool.team_size)}
                      </Badge>
                    ) : (
                      <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest italic">Any size</span>
                    )}
                  </td>
                )
              })}
            </tr>

            {/* Row: Tech */}
            <tr className="hover:bg-muted/30 transition-colors group bg-muted/5">
              <LabelCell icon={Layers} label="Tech" colorClass="text-blue-500" />
              {tools.map((tool, toolIdx) => {
                const isWinner = tools.length > 1 && toolIdx === highestRatingIdx && tool.avg_rating > 0
                return (
                  <td key={tool.id} className={cn("p-4 sm:p-5", isWinner && "border-l-4 border-l-primary bg-primary/[0.04]")}>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/50 block">API</span>
                        <Badge variant={tool.has_api ? "default" : "outline"} className={cn("text-[9px] h-5 px-1.5 font-bold uppercase", !tool.has_api && "opacity-30")}>
                          {tool.has_api ? 'Available' : 'No'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/50 block">Mobile</span>
                        <Badge variant={tool.has_mobile_app ? "default" : "outline"} className={cn("text-[9px] h-5 px-1.5 font-bold uppercase", !tool.has_mobile_app && "opacity-30")}>
                          {tool.has_mobile_app ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/50 block">Source</span>
                        <Badge variant={tool.is_open_source ? "secondary" : "outline"} className={cn("text-[9px] h-5 px-1.5 font-bold uppercase bg-emerald-500/10 text-emerald-700 border-none", !tool.is_open_source && "opacity-30")}>
                          {tool.is_open_source ? 'OSS' : 'Closed'}
                        </Badge>
                      </div>
                    </div>
                  </td>
                )
              })}
            </tr>

            {/* Row: Ecosystem / Integrations */}
            <tr className="hover:bg-muted/30 transition-colors group">
              <LabelCell icon={Zap} label="Stack" colorClass="text-amber-600" />
              {tools.map((tool, toolIdx) => {
                const isWinner = tools.length > 1 && toolIdx === highestRatingIdx && tool.avg_rating > 0
                return (
                  <td key={tool.id} className={cn("p-4 sm:p-5", isWinner && "border-l-4 border-l-primary bg-primary/[0.04]")}>
                    {tool.integrations && tool.integrations.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {tool.integrations.slice(0, 6).map((integration: string) => (
                          <Badge key={integration} variant="secondary" className="text-[9px] border border-foreground/5 bg-background font-bold uppercase h-6 px-2">
                            {labelize(integration)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">Standalone</span>
                    )}
                  </td>
                )
              })}
            </tr>

            {/* Row: Action */}
            <tr className="bg-muted/5">
              <td className="p-4 bg-muted/10 border-r border-foreground/5 sticky left-0 z-20"></td>
              {tools.map((tool, toolIdx) => {
                const isWinner = tools.length > 1 && toolIdx === highestRatingIdx && tool.avg_rating > 0
                return (
                  <td key={tool.id} className={cn("p-4 sm:p-5", isWinner && "border-l-4 border-l-primary bg-primary/[0.04]")}>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <a href={tool.website_url} target="_blank" rel="noopener noreferrer" title={`Launch ${tool.name}`}>
                        <Button className="h-10 px-4 gap-1.5 shadow-md shadow-primary/10 btn-primary text-sm">
                          <ExternalLink className="h-3.5 w-3.5" /> Visit
                        </Button>
                      </a>
                      <AddToStackButton
                        toolId={tool.id}
                        toolName={tool.name}
                        iconOnly
                        className="h-10 w-10"
                      />
                    </div>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
