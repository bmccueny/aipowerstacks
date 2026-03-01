import Link from 'next/link'
import type { Metadata } from 'next'
import { ExternalLink, Sparkles, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/reviews/StarRating'
import { createClient } from '@/lib/supabase/server'
import { getSuperTools } from '@/lib/supabase/queries/tools'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'
import { CompareSearch } from '@/components/tools/CompareSearch'
import { Suspense } from 'react'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tools?: string }>
}): Promise<Metadata> {
  const { tools } = await searchParams
  const slugCount = (tools ?? '')
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean)
    .length
  const isThinCompareState = slugCount > 0 && slugCount < 2

  return {
    title: 'Compare AI Tools',
    description: 'Compare AI tools side-by-side by pricing, fit, team size, integrations, and ratings.',
    alternates: {
      canonical: '/compare',
    },
    robots: isThinCompareState
      ? { index: false, follow: true }
      : { index: true, follow: true },
  }
}

type CompareTool = {
  id: string
  name: string
  slug: string
  tagline: string
  website_url: string
  pricing_model: string
  pricing_details: string | null
  pricing_type: string | null
  has_api: boolean
  has_mobile_app: boolean
  is_open_source: boolean
  has_cloud_sync: boolean
  avg_rating: number
  review_count: number
  use_case: string | null
  team_size: string | null
  integrations: string[] | null
  api_latency?: number | null
  api_uptime?: number | null
}

function labelize(value: string | null | undefined) {
  if (!value) return 'TBD'
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
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
      .select('id, name, slug, tagline, website_url, pricing_model, pricing_details, pricing_type, has_api, has_mobile_app, is_open_source, has_cloud_sync, avg_rating, review_count, use_case, team_size, integrations')
      .in('slug', slugs)
      .eq('status', 'published')
    : { data: [] as CompareTool[] }

  const tools = slugs
    .map((slug) => (data as CompareTool[] | undefined)?.find((tool) => tool.slug === slug))
    .filter(Boolean) as CompareTool[]

  const suggestions = await getSuperTools(4)
  const comparePresets = [
    {
      title: 'Most Compared Trio',
      description: 'Start with three popular options and narrow down quickly.',
      slugs: suggestions.slice(0, 3).map((tool) => tool.slug),
    },
    {
      title: 'Fast 2-Tool Check',
      description: 'Run a simple head-to-head before you commit.',
      slugs: suggestions.slice(0, 2).map((tool) => tool.slug),
    },
  ].filter((preset) => preset.slugs.length >= 2)

  return (
    <div className="page-shell">
      <div className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Decision View
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">Compare AI Tools</h1>
        <p className="text-muted-foreground mb-8">Compare pricing, fit, and integrations before you commit.</p>
        
        <Suspense>
          <CompareSearch currentSlugs={slugs} />
        </Suspense>
      </div>

      <section className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="glass-card rounded-md p-5">
          <h3 className="text-base font-semibold mb-2">Why compare first?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Comparing first reduces tool overlap, prevents expensive switches, and helps teams align on one stack faster.
          </p>
        </div>
        <div className="glass-card rounded-md p-5">
          <h3 className="text-base font-semibold mb-2">How to use this page</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Add tools from any detail page, then compare best use case, team fit, integrations, ratings, and pricing side-by-side.
          </p>
        </div>
      </section>

      {comparePresets.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Quick Starts</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {comparePresets.map((preset) => (
              <Link key={preset.title} href={`/compare?tools=${encodeURIComponent(preset.slugs.join(','))}`} className="glass-card rounded-md p-4 block">
                <p className="font-semibold text-sm">{preset.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{preset.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {tools.length < 2 ? (
        <div className="glass-card rounded-md p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Add at least 2 tools to compare. Use <span className="text-foreground font-medium">Add to Compare</span> on any tool page, or start with a quick preset below.
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((tool) => (
              <Link key={tool.id} href={`/compare?tools=${tool.slug}`}>
                <Badge variant="outline" className="border-foreground/30 hover:border-primary/40 transition-colors">
                  {tool.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-md overflow-x-auto">
          <div className="px-4 sm:px-5 py-3 border-b border-foreground/15 bg-background/60">
            <p className="text-xs text-muted-foreground">
              Tip: choose by <span className="text-foreground font-medium">Best Use Case</span> and <span className="text-foreground font-medium">Integrations</span> first, then validate pricing.
            </p>
          </div>
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-foreground/20">
                <th className="text-left p-4 text-sm text-muted-foreground font-medium">Feature</th>
                {tools.map((tool) => (
                  <th key={tool.id} className="text-left p-4 min-w-56">
                    <div className="space-y-2">
                      <div className="font-semibold">{tool.name}</div>
                      <p className="text-xs text-muted-foreground">{tool.tagline}</p>
                      <Link href={`/tools/${tool.slug}`} className="text-xs text-primary hover:underline">View details</Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-foreground/10">
                <td className="p-4 text-sm text-muted-foreground">Pricing</td>
                {tools.map((tool) => {
                  const label = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'
                  const showDetails = tool.pricing_details && tool.pricing_details.toLowerCase() !== label.toLowerCase()
                  return (
                    <td key={tool.id} className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-tight ${PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown}`}>
                            {label}
                          </Badge>
                          <span className="text-sm capitalize font-medium">
                            {tool.pricing_type?.replace('-', ' ') ?? 'Subscription'}
                          </span>
                        </div>
                        {showDetails && <p className="text-xs text-muted-foreground leading-snug">{tool.pricing_details}</p>}
                      </div>
                    </td>
                  )
                })}
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="p-4 text-sm text-muted-foreground">Rating</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4">
                    {tool.review_count > 0 ? (
                      <div className="space-y-1">
                        <StarRating rating={tool.avg_rating} size="sm" />
                        <p className="text-xs text-muted-foreground">{tool.avg_rating.toFixed(1)} ({tool.review_count} reviews)</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No reviews yet</p>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="p-4 text-sm text-muted-foreground">Capabilities</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold">API Access</span>
                        {tool.has_api ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30" />}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold">Mobile App</span>
                        {tool.has_mobile_app ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30" />}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold">Open Source</span>
                        {tool.is_open_source ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30" />}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold">Cloud Sync</span>
                        {tool.has_cloud_sync ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30" />}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-black/10">
                <td className="p-4 text-sm text-muted-foreground">API Latency</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4">
                    {tool.has_api ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">
                          {tool.api_latency ? `${tool.api_latency}ms` : '---'}
                        </span>
                        {tool.api_latency && (
                          <div className={`h-1.5 w-1.5 rounded-full ${tool.api_latency < 300 ? 'bg-emerald-500' : tool.api_latency < 1000 ? 'bg-amber-500' : 'bg-red-500'}`} />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-black/10">
                <td className="p-4 text-sm text-muted-foreground">API Uptime</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4">
                    {tool.has_api ? (
                      <span className="font-mono text-xs font-bold text-emerald-600">
                        {tool.api_uptime ? `${Number(tool.api_uptime).toFixed(1)}%` : '100%'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-foreground/10">
                <td className="p-4 text-sm text-muted-foreground">Use Case</td>

                {tools.map((tool) => (
                  <td key={tool.id} className="p-4 text-sm">
                    {labelize(tool.use_case)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="p-4 text-sm text-muted-foreground">Team Size</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4 text-sm">
                    {labelize(tool.team_size)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="p-4 text-sm text-muted-foreground">Integrations</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4">
                    {tool.integrations && tool.integrations.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {tool.integrations.map((integration) => (
                          <Badge key={integration} variant="outline" className="text-[10px] border-foreground/30">
                            {labelize(integration)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">TBD</p>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-sm text-muted-foreground">Visit Website</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4">
                    <a href={tool.website_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="gap-1.5 !border !border-black/20">
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
