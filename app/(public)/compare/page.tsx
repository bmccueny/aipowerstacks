import Link from 'next/link'
import type { Metadata } from 'next'
import { 
  ExternalLink, Sparkles, Check, X, Info, Trophy, Zap, 
  ArrowRight, MousePointer2, Share2, Plus, Notebook, 
  Video, Mic, Palette, ChevronDown, LayoutGrid 
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/reviews/StarRating'
import { createClient } from '@/lib/supabase/server'
import { getSuperTools, getSimilarTools } from '@/lib/supabase/queries/tools'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import { CompareSearch } from '@/components/tools/CompareSearch'
import { MatrixAutoFocus } from '@/components/tools/MatrixAutoFocus'
import { Suspense } from 'react'
import { cn } from '@/lib/utils'
import { CompareTable } from '@/components/tools/CompareTable'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tools?: string }>
}): Promise<Metadata> {
  const { tools: toolsParam } = await searchParams
  const slugs = (toolsParam ?? '')
    .split(',')
    .map((slug) => slug.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 3)

  const isThinCompareState = slugs.length > 0 && slugs.length < 2
  
  let title = 'Compare AI Tools Side-by-Side | AIPowerStacks'
  let description = 'Make informed decisions with our AI comparison engine. Compare features, pricing, pros, and cons side-by-side.'

  if (slugs.length >= 1) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('tools')
      .select('name')
      .in('slug', slugs)
    
    if (data && data.length > 0) {
      const names = data.map(t => t.name).join(' vs ')
      title = `${names} Comparison | AIPowerStacks`
      description = `Side-by-side technical breakdown of ${names}. Compare pricing, API access, pros, and cons to find the best fit for your workflow.`
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: '/compare',
    },
    robots: isThinCompareState
      ? { index: false, follow: true }
      : { index: true, follow: true },
  }
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ tools?: string }>
}) {
  const { tools: toolsParam } = await searchParams
  const slugs = (toolsParam ?? '')
    .split(',')
    .map((slug) => slug.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 3)

  const supabase = await createClient()
  const { data } = slugs.length
    ? await supabase
      .from('tools')
      .select('id, name, slug, tagline, website_url, logo_url, pricing_model, pricing_details, pricing_tags, pricing_type, has_api, has_mobile_app, is_open_source, has_cloud_sync, avg_rating, review_count, use_case, team_size, integrations, pros, cons, is_supertools')
      .in('slug', slugs)
      .eq('status', 'published')
    : { data: [] as any[] }

  const tools = slugs
    .map((slug) => (data as any[] | undefined)?.find((tool) => tool.slug === slug))
    .filter(Boolean)

  const recommendations = slugs.length > 0 
    ? await getSimilarTools(slugs, 4)
    : await getSuperTools(4)

  const comparePresets = [
    {
      title: 'Top Tier Coding',
      description: 'Compare the industry leaders in AI software development.',
      slugs: ['cursor-editor', 'devin-pro', 'claude-code'],
      icon: <Zap className="h-4 w-4 text-amber-500" />
    },
    {
      title: 'Content Powerhouse',
      description: 'Head-to-head for marketing and creative teams.',
      slugs: ['jasper-brand-voice', 'copy-ai', 'writesonic-ai'],
      icon: <Trophy className="h-4 w-4 text-primary" />
    },
    {
      title: 'AI Note-Taking',
      description: 'Compare AI-powered knowledge bases and smart notes.',
      slugs: ['notion-ai', 'obsidian-ai', 'mem-ai'],
      icon: <Notebook className="h-4 w-4 text-blue-500" />
    },
    {
      title: 'AI Film Studio',
      description: 'Professional text-to-video tools side-by-side.',
      slugs: ['sora-2', 'runway-gen-3', 'kling-ai'],
      icon: <Video className="h-4 w-4 text-rose-500" />
    },
    {
      title: 'Voice & Dubbing',
      description: 'The best AI voice cloning and translation tech.',
      slugs: ['elevenlabs-dubbing', 'murf-ai', 'lovo-ai'],
      icon: <Mic className="h-4 w-4 text-indigo-500" />
    },
    {
      title: 'Visual Design',
      description: 'High-fidelity generative art head-to-head.',
      slugs: ['midjourney-v7', 'flux2', 'gpt-image-15'],
      icon: <Palette className="h-4 w-4 text-orange-500" />
    },
  ]

  const activePreset = comparePresets.find(p => 
    p.slugs.length === slugs.length && 
    p.slugs.every(s => slugs.includes(s))
  )

  return (
    <div className="page-shell">
      <Suspense>
        <MatrixAutoFocus />
      </Suspense>

      {/* Enhanced Hero Section */}
      <div className="page-hero relative overflow-hidden text-center py-12 sm:py-16 mb-8">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        <div className="relative z-10 px-4">
          <div className="inline-flex items-center gap-2 gum-pill px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] mb-6 animate-in-stagger">
            <Sparkles className="h-3.5 w-3.5" />
            AI Decision Engine
          </div>
          <h1 className="text-4xl sm:text-6xl font-black mb-4 tracking-tighter animate-in-stagger" style={{ animationDelay: '0.1s' }}>
            Compare <span className="text-primary italic">Better</span>.
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg animate-in-stagger" style={{ animationDelay: '0.2s' }}>
            Stop guessing and start building. Compare technical specs, real-world pros/cons, and pricing side-by-side.
          </p>
        </div>
      </div>

      {/* Mobile Preset Trigger - Only visible on small screens */}
      <div className="lg:hidden mb-6 px-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className={cn(
              "w-full h-12 justify-between border-foreground/10 bg-background shadow-sm rounded-xl px-4",
              activePreset && "border-primary/30 bg-primary/5"
            )}>
              <div className="flex items-center gap-3">
                {activePreset ? (
                  <>
                    <div className="text-primary">{activePreset.icon}</div>
                    <span className="font-black uppercase tracking-widest text-[10px] text-primary truncate max-w-[200px]">Active: {activePreset.title}</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    <span className="font-black uppercase tracking-widest text-[10px] text-foreground">Select Comparison Preset</span>
                  </>
                )}
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] p-2 backdrop-blur-xl bg-background/95 z-[60]">
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3 py-2">Quick Start Matrix</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-1 gap-1">
              {comparePresets.map((preset) => (
                <DropdownMenuItem key={preset.title} asChild className="p-0">
                  <Link 
                    href={`/compare?tools=${encodeURIComponent(preset.slugs.join(','))}`}
                    className={cn(
                      "flex items-center gap-4 p-3 cursor-pointer rounded-xl transition-colors",
                      activePreset?.title === preset.title ? "bg-primary/10" : "hover:bg-primary/5"
                    )}
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {preset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("font-bold text-sm leading-none", activePreset?.title === preset.title ? "text-primary" : "text-foreground")}>{preset.title}</p>
                        {activePreset?.title === preset.title && <Check className="h-3 w-3 text-primary" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-1">{preset.description}</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-8 lg:grid-cols-4 items-start">
        {/* Sidebar / Info - Visible only on Desktop */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6 sticky top-24">
          <div className="glass-card rounded-xl p-6 border-primary/10">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <Info className="h-3.5 w-3.5" /> Quick Guide
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-foreground mb-1">Add Tools</p>
                <p className="text-xs text-muted-foreground">Use the search bar to find and add up to 3 tools to your matrix.</p>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-foreground mb-1">Save State</p>
                <p className="text-xs text-muted-foreground">The URL updates automatically. Copy the link to save or share your comparison.</p>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-foreground mb-1">Remove</p>
                <p className="text-xs text-muted-foreground">Click the &quot;X&quot; on any tool header to remove it from the list.</p>
              </div>
            </div>
          </div>

          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 px-1">Quick Presets</h2>
            <div className="grid gap-3">
              {comparePresets.map((preset) => (
                <Link 
                  key={preset.title} 
                  href={`/compare?tools=${encodeURIComponent(preset.slugs.join(','))}`} 
                  className={cn(
                    "glass-card rounded-xl p-4 block transition-all group border-transparent",
                    activePreset?.title === preset.title ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {preset.icon}
                    <p className={cn("font-bold text-sm group-hover:text-primary transition-colors", activePreset?.title === preset.title ? "text-primary" : "text-foreground")}>{preset.title}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{preset.description}</p>
                  <div className="mt-3 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transform translate-x-[-4px] group-hover:translate-x-0 transition-all">
                    {activePreset?.title === preset.title ? 'Active' : 'Compare Now'}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </aside>

        {/* Comparison Table Section */}
        <div id="comparison-matrix" className="lg:col-span-3 space-y-6">
          <div className="animate-in-stagger relative z-30" style={{ animationDelay: '0.3s' }}>
            <Suspense>
              <CompareSearch currentSlugs={slugs} />
            </Suspense>
          </div>

          {/* Dynamic Recommendations */}
          {recommendations.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-2 animate-in fade-in slide-in-from-left-4 duration-500 delay-300">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" /> 
                {slugs.length > 0 ? 'Smart Addition:' : 'Top Starts:'}
              </span>
              {recommendations.slice(0, 3).map((rec) => (
                <Link 
                  key={rec.id} 
                  href={`/compare?tools=${[...slugs, rec.slug].join(',')}`}
                  className="group"
                >
                  <Badge variant="outline" className="h-8 border-foreground/10 hover:border-primary/40 hover:bg-primary/5 transition-all bg-background cursor-pointer gap-2 pr-3">
                    <div className="h-4 w-4 rounded bg-white overflow-hidden border border-foreground/5 shrink-0 flex items-center justify-center">
                      {rec.logo_url ? (
                        <img src={rec.logo_url} alt="" className="object-contain" />
                      ) : (
                        <span className="text-[8px] font-black text-primary">{rec.name[0]}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold">{rec.name}</span>
                    <Plus className="h-2.5 w-2.5 text-primary opacity-40 group-hover:opacity-100" />
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {tools.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border-dashed flex flex-col items-center justify-center min-h-[400px]">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                <MousePointer2 className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">Build Your Matrix</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
                Search for your first tool above or start with one of our suggestions below.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {recommendations.map((tool) => (
                  <Link key={tool.id} href={`/compare?tools=${tool.slug}`}>
                    <Badge variant="outline" className="h-9 px-4 border-foreground/20 hover:border-primary/40 transition-colors bg-background font-bold text-xs cursor-pointer">
                      + {tool.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <CompareTable tools={tools} />
          )}
        </div>
      </div>
    </div>
  )
}
