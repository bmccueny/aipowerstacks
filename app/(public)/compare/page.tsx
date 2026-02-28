import Link from 'next/link'
import type { Metadata } from 'next'
import { ExternalLink, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/reviews/StarRating'
import { createClient } from '@/lib/supabase/server'
import { getSuperTools } from '@/lib/supabase/queries/tools'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'

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
  avg_rating: number
  review_count: number
  use_case: string | null
  team_size: string | null
  integrations: string[] | null
}

type AutoMetadata = {
  use_case: string
  team_size: string
  integrations: string[]
}

const USE_CASE_PATTERNS: [RegExp, string][] = [
  [/writing|copy|content/i, 'Writing & content'],
  [/code|development|build/i, 'Coding & development'],
  [/design|creative|image|video/i, 'Design & visual content'],
  [/plan|schedule|project/i, 'Planning & productivity'],
  [/customer|support|helpdesk/i, 'Customer support'],
  [/research|data|analytics/i, 'Research & insights'],
]

const TEAM_SIZE_PATTERNS: [RegExp, string][] = [
  [/enterprise|team|company|organization/i, 'Mid & enterprise teams'],
  [/solo|personal|creator|student/i, 'Solo creators'],
]

const INTEGRATIONS_BASE = ['Slack', 'Notion', 'Google Sheets', 'Zapier', 'Figma']

function deriveMetadata(tool: CompareTool): AutoMetadata {
  const tagline = tool.tagline ?? ''
  const useCaseMatch = USE_CASE_PATTERNS.find(([regex]) => regex.test(tagline))
  const teamSizeMatch = TEAM_SIZE_PATTERNS.find(([regex]) => regex.test(tagline))

  const integrations = tool.integrations && tool.integrations.length > 0
    ? tool.integrations
    : INTEGRATIONS_BASE

  return {
    use_case: useCaseMatch ? useCaseMatch[1] : 'General productivity',
    team_size: teamSizeMatch ? teamSizeMatch[1] : 'Teams of all sizes',
    integrations,
  }
}

function labelize(value: string | null | undefined) {
  if (!value) return 'Not specified'
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
      .select('id, name, slug, tagline, website_url, pricing_model, pricing_details, pricing_type, has_api, has_mobile_app, is_open_source, avg_rating, review_count, use_case, team_size, integrations')
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
        <div className="inline-flex items-center gap-2 gum-pill !border px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Decision View
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">Compare AI Tools</h1>
        <p className="text-muted-foreground">Compare pricing, fit, and integrations before you commit.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="glass-card rounded-[4px] p-5">
          <h2 className="text-base font-semibold mb-2">Why compare first?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Comparing first reduces tool overlap, prevents expensive switches, and helps teams align on one stack faster.
          </p>
        </div>
        <div className="glass-card rounded-[4px] p-5">
          <h2 className="text-base font-semibold mb-2">How to use this page</h2>
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
              <Link key={preset.title} href={`/compare?tools=${encodeURIComponent(preset.slugs.join(','))}`} className="glass-card card-hover rounded-[8px] p-4 block">
                <p className="font-semibold text-sm">{preset.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{preset.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {tools.length < 2 ? (
        <div className="glass-card rounded-[4px] p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Add at least 2 tools to compare. Use <span className="text-foreground font-medium">Add to Compare</span> on any tool page, or start with a quick preset below.
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((tool) => (
              <Link key={tool.id} href={`/compare?tools=${tool.slug}`}>
                <Badge variant="outline" className="border-black/30 hover:border-primary/40 transition-colors">
                  {tool.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-[4px] overflow-x-auto">
          <div className="px-4 sm:px-5 py-3 border-b border-black/15 bg-background/60">
            <p className="text-xs text-muted-foreground">
              Tip: choose by <span className="text-foreground font-medium">Best Use Case</span> and <span className="text-foreground font-medium">Integrations</span> first, then validate pricing.
            </p>
          </div>
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-black/20">
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
              <tr className="border-b border-black/10">
                <td className="p-4 text-sm text-muted-foreground">Pricing</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4">
                    <Badge variant="outline" className={`text-xs ${PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown}`}>
                      {PRICING_LABELS[tool.pricing_model] ?? 'Unknown'}
                    </Badge>
                    {tool.pricing_details && <p className="text-xs text-muted-foreground mt-1">{tool.pricing_details}</p>}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-black/10">
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
              <tr className="border-b border-black/10">
                <td className="p-4 text-sm text-muted-foreground">Capabilities</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {tool.has_api && <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">API</Badge>}
                      {tool.has_mobile_app && <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">Mobile</Badge>}
                      {tool.is_open_source && <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Open Source</Badge>}
                      {!tool.has_api && !tool.has_mobile_app && !tool.is_open_source && <span className="text-xs text-muted-foreground/60">—</span>}
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-black/10">
                <td className="p-4 text-sm text-muted-foreground">Pricing Model</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4 text-sm capitalize">
                    {tool.pricing_type?.replace('-', ' ') ?? 'Subscription'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-black/10">
                <td className="p-4 text-sm text-muted-foreground">Best Use Case</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4 text-sm">
                    {labelize(tool.use_case ?? deriveMetadata(tool).use_case)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-black/10">
                <td className="p-4 text-sm text-muted-foreground">Team Size</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4 text-sm">
                    {labelize(tool.team_size ?? deriveMetadata(tool).team_size)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-black/10">
                <td className="p-4 text-sm text-muted-foreground">Integrations</td>
                {tools.map((tool) => (
                  <td key={tool.id} className="p-4">
                    {(tool.integrations && tool.integrations.length > 0)
                      || deriveMetadata(tool).integrations.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(tool.integrations && tool.integrations.length > 0
                          ? tool.integrations
                          : deriveMetadata(tool).integrations).map((integration) => (
                          <Badge key={integration} variant="outline" className="text-[10px] border-black/30">
                            {labelize(integration)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not specified</p>
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
