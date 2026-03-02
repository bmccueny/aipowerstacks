'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ExternalLink, Check, X, Zap, ArrowRight, Share2, 
  Copy, CheckCircle2, DollarSign, Star, ThumbsUp, 
  Settings, Layers, Target, ShieldCheck, Twitter, Mail,
  Linkedin, Facebook
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

  const shareX = () => {
    const text = `Check out this AI tool comparison on AIPowerStacks: ${tools.map(t => t.name).join(' vs ')}`
    const url = window.location.href
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const shareLinkedin = () => {
    const url = window.location.href
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
  }

  const shareFacebook = () => {
    const url = window.location.href
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }

  const shareNotion = () => {
    const text = `AI Tool Comparison: ${tools.map(t => t.name).join(' vs ')}\nLink: ${window.location.href}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareObsidian = () => {
    const title = `AI Comparison - ${new Date().toLocaleDateString()}`
    const content = `# AI Tool Comparison\n\nGenerated from AIPowerStacks\n\n## Tools\n${tools.map(t => `- [[${t.name}]]`).join('\n')}\n\n[View Full Matrix](${window.location.href})`
    window.open(`obsidian://new?name=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`)
  }

  const shareEmail = () => {
    const subject = `AI Tool Comparison: ${tools.map(t => t.name).join(' vs ')}`
    const body = `I thought you might find this AI tool comparison useful:\n\n${window.location.href}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const labelize = (value: string | null | undefined) => {
    if (!value) return 'TBD'
    return value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  const LabelCell = ({ icon: Icon, label, colorClass }: { icon: any, label: string, colorClass?: string }) => (
    <td className="p-3 sm:p-4 lg:p-5 bg-muted/20 border-r border-foreground/5 sticky left-0 z-20 backdrop-blur-sm text-center">
      <div className="flex flex-col items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
        <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", colorClass || "text-muted-foreground")} />
        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-center leading-none">
          {label}
        </span>
      </div>
    </td>
  )

  return (
    <div className="glass-card rounded-2xl overflow-hidden border-foreground/10 shadow-xl">
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
                <div className="h-4 w-4 shrink-0 rounded-sm overflow-hidden flex items-center justify-center border border-foreground/10 bg-white">
                  <img src="https://www.google.com/s2/favicons?domain=notion.so&sz=32" alt="" className="h-full w-full object-contain" />
                </div>
                <span className="font-bold">Copy for Notion</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareObsidian} className="gap-3 cursor-pointer">
                <div className="h-4 w-4 shrink-0 rounded-sm overflow-hidden flex items-center justify-center border border-foreground/10 bg-white">
                  <img src="https://www.google.com/s2/favicons?domain=obsidian.md&sz=32" alt="" className="h-full w-full object-contain" />
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
        <table className="w-full min-w-[650px] lg:min-w-full table-fixed border-separate border-spacing-0">
          <thead>
            <tr className="bg-background sticky top-0 z-20 shadow-sm">
              <th className="p-4 sm:p-6 w-[80px] sm:w-[100px] lg:w-[120px] bg-background border-b border-r border-foreground/10 sticky left-0 z-30">
                <div className="flex flex-col items-center gap-1 opacity-40">
                  <Settings className="h-4 w-4" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">Fields</span>
                </div>
              </th>
              {tools.map((tool) => (
                <th key={tool.id} className="text-left p-5 sm:p-6 lg:p-8 align-top group relative border-b border-foreground/10 bg-background/95">
                  <button 
                    onClick={() => removeTool(tool.slug)}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white transition-all sm:opacity-0 group-hover:opacity-100 z-30"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4 mb-3 sm:mb-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 shrink-0 rounded-xl border border-foreground/10 bg-white shadow-sm overflow-hidden flex items-center justify-center p-1.5">
                        {tool.logo_url ? (
                          <img src={tool.logo_url} alt={tool.name} className="object-contain" />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center font-black text-primary uppercase text-xl">
                            {tool.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-black tracking-tight text-[13px] sm:text-lg lg:text-xl leading-[1.1] mb-1 group-hover:text-primary transition-colors line-clamp-2">
                          {tool.name}
                        </div>
                        {tool.is_supertools && (
                          <div className="flex">
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[7px] lg:text-[9px] font-black uppercase h-3.5 px-1 leading-none">
                              SuperTool
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/70 hover:text-primary hover:underline transition-colors">
                      Specifications <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/5 text-foreground">
            {/* Row: Pricing Badges */}
            <tr className="hover:bg-muted/30 transition-colors group border-b border-foreground/5">
              <LabelCell icon={DollarSign} label="Billing" colorClass="text-emerald-600 dark:text-emerald-400" />
              {tools.map((tool) => {
                const label = PRICING_LABELS[tool.pricing_model as keyof typeof PRICING_LABELS] ?? 'Unknown'
                const color = PRICING_BADGE_COLORS[tool.pricing_model as keyof typeof PRICING_BADGE_COLORS] ?? PRICING_BADGE_COLORS.unknown
                return (
                  <td key={tool.id} className="p-5 sm:p-6 lg:p-8">
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      <Badge variant="outline" className={cn("text-[10px] font-black uppercase px-2 h-6 border-2", color)}>
                        {label}
                      </Badge>
                      {tool.pricing_tags?.slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[9px] bg-stone-100 dark:bg-stone-800 text-foreground/70 border-none font-bold uppercase h-6 px-2">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                )
              })}
            </tr>

            {/* Row: Pricing Details */}
            <tr className="hover:bg-muted/30 transition-colors group border-b border-foreground/5 bg-muted/5">
              <LabelCell icon={Copy} label="Details" />
              {tools.map((tool) => (
                <td key={tool.id} className="p-5 sm:p-6 lg:p-8">
                  {tool.pricing_details && tool.pricing_details !== 'N/A' ? (
                    <p className="text-[11px] lg:text-[12px] text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-3">
                      {tool.pricing_details}
                    </p>
                  ) : (
                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest italic">No specific notes</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Row: Rating */}
            <tr className="hover:bg-muted/30 transition-colors group">
              <LabelCell icon={Star} label="Stars" colorClass="text-amber-500" />
              {tools.map((tool) => (
                <td key={tool.id} className="p-5 sm:p-6 lg:p-8">
                  {tool.review_count > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <StarRating rating={tool.avg_rating} size="sm" />
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {tool.avg_rating.toFixed(1)} <span className="font-normal opacity-50">/ 5.0</span>
                      </p>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Unrated</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Row: Pros */}
            <tr className="hover:bg-muted/30 transition-colors group bg-emerald-50/5">
              <LabelCell icon={ThumbsUp} label="Pros" colorClass="text-emerald-500" />
              {tools.map((tool) => (
                <td key={tool.id} className="p-5 sm:p-6 lg:p-8 align-top">
                  <ul className="space-y-3">
                    {(tool.pros || []).slice(0, 3).map((pro: string, i: number) => (
                      <li key={i} className="text-[11px] lg:text-[12px] leading-snug flex items-start gap-3 text-foreground/90">
                        <div className="h-4 w-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                          <Check className="h-2.5 w-2.5 text-emerald-600" />
                        </div>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Row: Cons */}
            <tr className="hover:bg-muted/30 transition-colors group bg-red-50/5">
              <LabelCell icon={X} label="Cons" colorClass="text-red-500" />
              {tools.map((tool) => (
                <td key={tool.id} className="p-5 sm:p-6 lg:p-8 align-top">
                  <ul className="space-y-3">
                    {(tool.cons || []).slice(0, 3).map((con: string, i: number) => (
                      <li key={i} className="text-[11px] lg:text-[12px] leading-snug flex items-start gap-3 text-foreground/90">
                        <div className="h-4 w-4 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5 border border-red-500/20">
                          <X className="h-2.5 w-2.5 text-red-600" />
                        </div>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Row: Use Case */}
            <tr className="hover:bg-muted/30 transition-colors group">
              <LabelCell icon={Target} label="Fit" colorClass="text-primary" />
              {tools.map((tool) => (
                <td key={tool.id} className="p-5 sm:p-6 lg:p-8">
                  <div className="text-[11px] lg:text-[12px] font-medium leading-relaxed bg-muted/30 p-4 rounded-xl border border-foreground/5 shadow-inner">
                    {labelize(tool.use_case)}
                  </div>
                </td>
              ))}
            </tr>

            {/* Row: Infrastructure */}
            <tr className="hover:bg-muted/30 transition-colors group">
              <LabelCell icon={Layers} label="Tech" colorClass="text-blue-500" />
              {tools.map((tool) => (
                <td key={tool.id} className="p-5 sm:p-6 lg:p-8">
                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/50 block">Sync</span>
                      <Badge variant={tool.has_cloud_sync ? "default" : "outline"} className={cn("text-[9px] h-5 px-1.5 font-bold uppercase", !tool.has_cloud_sync && "opacity-30")}>
                        {tool.has_cloud_sync ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </td>
              ))}
            </tr>

            {/* Row: Ecosystem */}
            <tr className="hover:bg-muted/30 transition-colors group">
              <LabelCell icon={Zap} label="Stack" colorClass="text-amber-600" />
              {tools.map((tool) => (
                <td key={tool.id} className="p-5 sm:p-6 lg:p-8">
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
              ))}
            </tr>

            {/* Row: Action */}
            <tr className="bg-muted/5">
              <td className="p-4 bg-muted/10 border-r border-foreground/5 sticky left-0 z-20"></td>
              {tools.map((tool) => (
                <td key={tool.id} className="p-5 sm:p-6 lg:p-8">
                  <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button className="w-full gap-2 font-black uppercase tracking-widest text-[10px] h-12 shadow-lg shadow-primary/10 btn-stack-effect">
                      Launch <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
