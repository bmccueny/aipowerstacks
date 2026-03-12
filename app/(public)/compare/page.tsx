import Link from 'next/link'
import type { Metadata } from 'next'
import { 
  Sparkles, Check, Plus, ChevronDown, LayoutGrid,
  Zap, Trophy, Notebook, Video, Mic, Palette
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
import { createClient } from '@/lib/supabase/server'
import { getSuperTools, getSimilarTools } from '@/lib/supabase/queries/tools'
import { CompareSearch } from '@/components/tools/CompareSearch'
import { MatrixAutoFocus } from '@/components/tools/MatrixAutoFocus'
import { Suspense } from 'react'
import { cn } from '@/lib/utils'
import { CompareTable } from '@/components/tools/CompareTable'

const MAX_TOOLS = 4

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
    .slice(0, MAX_TOOLS)

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
    .slice(0, MAX_TOOLS)

  const supabase = await createClient()

  const [{ data }, recommendations] = await Promise.all([
    slugs.length
      ? supabase
          .from('tools')
          .select('id, name, slug, tagline, website_url, logo_url, pricing_model, pricing_details, pricing_tags, has_api, has_mobile_app, is_open_source, avg_rating, review_count, use_case, team_size, integrations, pros, cons, is_supertools, model_provider, trains_on_data, has_sso, security_certifications')
          .in('slug', slugs)
          .eq('status', 'published')
      : Promise.resolve({ data: [] as any[] }),
    slugs.length > 0 ? getSimilarTools(slugs, 4) : getSuperTools(4),
  ])

  const tools = slugs
    .map((slug) => (data as any[] | undefined)?.find((tool) => tool.slug === slug))
    .filter(Boolean)

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
    <div className="page-shell max-w-7xl mx-auto">
      <Suspense>
        <MatrixAutoFocus />
      </Suspense>

      {/* ─── Compact header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-primary mb-2">
            <Sparkles className="h-3 w-3" />
            AI Comparison Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {tools.length >= 2
              ? tools.map(t => t.name).join(' vs ')
              : 'Compare AI Tools'}
          </h1>
        </div>

        {/* Preset dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={cn(
              "h-9 gap-2 border-foreground/10 text-xs font-bold shrink-0",
              activePreset && "border-primary/30 bg-primary/5 text-primary"
            )}>
              <LayoutGrid className="h-3.5 w-3.5" />
              {activePreset ? activePreset.title : 'Presets'}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest opacity-40">Quick Comparisons</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {comparePresets.map((preset) => (
              <DropdownMenuItem key={preset.title} asChild className="p-0">
                <Link 
                  href={`/compare?tools=${encodeURIComponent(preset.slugs.join(','))}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                    activePreset?.title === preset.title && "bg-primary/5"
                  )}
                >
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">{preset.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-bold text-xs", activePreset?.title === preset.title && "text-primary")}>{preset.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{preset.description}</p>
                  </div>
                  {activePreset?.title === preset.title && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ─── Search bar ─── */}
      <div className="mb-4">
        <Suspense>
          <CompareSearch currentSlugs={slugs} />
        </Suspense>
      </div>

      {/* ─── Recommendations / suggestions ─── */}
      {recommendations.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> 
            {slugs.length > 0 ? 'Try adding:' : 'Popular:'}
          </span>
          {recommendations.slice(0, 4).map((rec) => (
            <Link 
              key={rec.id} 
              href={`/compare?tools=${[...slugs, rec.slug].join(',')}`}
              className="group"
            >
              <Badge variant="outline" className="h-7 sm:h-8 border-foreground/10 hover:border-primary/40 hover:bg-primary/5 transition-all bg-background cursor-pointer gap-1.5 sm:gap-2 pr-2.5 sm:pr-3 text-[9px] sm:text-[10px]">
                <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded bg-white overflow-hidden border border-foreground/5 shrink-0 flex items-center justify-center">
                  {rec.logo_url ? (
                    <img src={rec.logo_url} alt={`${rec.name} logo`} className="object-contain" />
                  ) : (
                    <span className="text-[6px] sm:text-[8px] font-black text-primary">{rec.name[0]}</span>
                  )}
                </div>
                <span className="font-bold">{rec.name}</span>
                <Plus className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-primary opacity-40 group-hover:opacity-100" />
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* ─── Matrix ─── */}
      <div id="comparison-matrix">
        {tools.length === 0 ? (
          <div className="border border-dashed border-foreground/10 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-5">
              <LayoutGrid className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold mb-2">Start Your Comparison</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Search for a tool above, pick a preset, or start with a suggestion.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {recommendations.map((tool) => (
                <Link key={tool.id} href={`/compare?tools=${tool.slug}`}>
                  <Badge variant="outline" className="h-8 sm:h-9 px-3 sm:px-4 border-foreground/15 hover:border-primary/40 transition-colors bg-background font-bold text-[10px] sm:text-xs cursor-pointer">
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
  )
}
