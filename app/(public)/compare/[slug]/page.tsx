import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Star, ArrowRight, Check, X, ArrowLeftRight, Globe, Smartphone, Code, Lock, Server } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/common/JsonLd'
import { PRICING_LABELS, PRICING_BADGE_COLORS } from '@/lib/constants'
import { SITE_URL } from '@/lib/constants/site'
import { getSimilarTools } from '@/lib/supabase/queries/tools'
import { cn } from '@/lib/utils'

type VsTool = {
  id: string
  name: string
  slug: string
  tagline: string
  logo_url: string | null
  website_url: string
  pricing_model: string
  avg_rating: number
  review_count: number
  is_verified: boolean
  is_open_source: boolean
  has_api: boolean
  has_mobile_app: boolean
  has_sso: boolean
  trains_on_data: boolean
  model_provider: string | null
  is_api_wrapper: boolean
  use_cases: string[] | null
  use_case: string | null
  target_audience: string | null
  team_size: string | null
  integrations: string[] | null
  deployment_type: string | null
  time_to_value: string | null
  pros: string[] | null
  cons: string[] | null
  pricing_tags: string[] | null
  pricing_details: string | null
  categories: { name: string; slug: string } | null
}

const TOOL_SELECT =
  'id, name, slug, tagline, logo_url, website_url, pricing_model, avg_rating, review_count, is_verified, is_open_source, has_api, has_mobile_app, has_sso, trains_on_data, model_provider, is_api_wrapper, use_cases, use_case, target_audience, team_size, integrations, deployment_type, time_to_value, pros, cons, pricing_tags, pricing_details, categories:category_id(name, slug)'

const USE_CASE_LABELS: Record<string, string> = {
  coding: 'Coding',
  'content-creation': 'Content Creation',
  marketing: 'Marketing',
  design: 'Design',
  research: 'Research',
  video: 'Video',
  sales: 'Sales',
  'customer-support': 'Customer Support',
}

const TEAM_SIZE_LABELS: Record<string, string> = {
  solo: 'Solo / Individual',
  small: 'Small Team (2-10)',
  medium: 'Medium (10-50)',
  large: 'Large (50-200)',
  enterprise: 'Enterprise (200+)',
}

const DEPLOYMENT_LABELS: Record<string, string> = {
  cloud: 'Cloud Only',
  'self-hosted': 'Self-Hosted',
  both: 'Cloud + Self-Hosted',
}

const TIME_TO_VALUE_LABELS: Record<string, string> = {
  instant: 'Instant',
  minutes: 'Minutes',
  hours: 'Hours',
  days: 'Days',
  weeks: 'Weeks',
}

function parseVsSlug(slug: string): [string, string] | null {
  const parts = slug.split('-vs-')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  return [parts[0], parts[1]]
}

function BooleanIcon({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-500/15">
      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
    </span>
  ) : (
    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 dark:bg-red-500/15">
      <X className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
    </span>
  )
}

function RatingStars({ rating, count }: { rating: number; count: number }) {
  if (rating <= 0) return <span className="text-sm text-muted-foreground">No ratings yet</span>
  const fullStars = Math.floor(rating)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-3.5 w-3.5',
              i < fullStars
                ? 'fill-primary text-primary'
                : i < Math.ceil(rating)
                  ? 'fill-primary/50 text-primary'
                  : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>
      <span className="text-sm font-bold">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const parsed = parseVsSlug(slug)
  if (!parsed) return {}

  const supabase = createAdminClient()
  const [{ data: a }, { data: b }] = await Promise.all([
    supabase
      .from('tools')
      .select('name, tagline')
      .eq('slug', parsed[0])
      .eq('status', 'published')
      .single(),
    supabase
      .from('tools')
      .select('name, tagline')
      .eq('slug', parsed[1])
      .eq('status', 'published')
      .single(),
  ])

  if (!a || !b) return {}

  return {
    title: `${a.name} vs ${b.name}: Side-by-Side Comparison | AIPowerStacks`,
    description: `Compare ${a.name} and ${b.name} side by side. See pricing, features, ratings, pros and cons to pick the right AI tool for your workflow.`,
    alternates: { canonical: `/compare/${slug}` },
    openGraph: {
      title: `${a.name} vs ${b.name} Comparison`,
      description: `Compare ${a.name} and ${b.name} side by side on AIPowerStacks.`,
      url: `${SITE_URL}/compare/${slug}`,
    },
  }
}

export default async function VsComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const parsed = parseVsSlug(slug)
  if (!parsed) notFound()

  const supabase = createAdminClient()

  const [resA, resB] = await Promise.all([
    supabase
      .from('tools')
      .select(TOOL_SELECT)
      .eq('slug', parsed[0])
      .eq('status', 'published')
      .single(),
    supabase
      .from('tools')
      .select(TOOL_SELECT)
      .eq('slug', parsed[1])
      .eq('status', 'published')
      .single(),
  ])

  const toolA = resA.data as unknown as VsTool | null
  const toolB = resB.data as unknown as VsTool | null

  if (!toolA || !toolB) notFound()

  const tools: VsTool[] = [toolA, toolB]
  const similar = await getSimilarTools([toolA.slug, toolB.slug], 4)

  return (
    <div className="page-shell max-w-5xl mx-auto pb-24">
      {/* JSON-LD */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${toolA.name} vs ${toolB.name} Comparison`,
          description: `Compare ${toolA.name} and ${toolB.name} side by side.`,
          url: `${SITE_URL}/compare/${slug}`,
        }}
      />

      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground mb-8 flex items-center gap-1.5">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/compare" className="hover:text-foreground transition-colors">
          Compare
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {toolA.name} vs {toolB.name}
        </span>
      </nav>

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {toolA.name}{' '}
          <span className="text-muted-foreground font-normal">vs</span>{' '}
          {toolB.name}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A detailed side-by-side comparison to help you choose the right tool
          for your workflow.
        </p>
      </div>

      {/* ═══ Visual Side-by-Side Comparison Table ═══ */}
      <div className="glass-card rounded-xl overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            {/* Header: Tool logos and names */}
            <thead>
              <tr className="border-b border-border/50">
                <th className="w-[200px] px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Feature
                </th>
                {tools.map((tool) => (
                  <th key={tool.id} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                        {tool.logo_url ? (
                          <img
                            src={tool.logo_url}
                            alt={tool.name}
                            width={56}
                            height={56}
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-xl font-black text-primary">
                            {tool.name[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <Link href={`/tools/${tool.slug}`} className="font-bold text-base hover:text-primary transition-colors">
                          {tool.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[200px]">{tool.tagline}</p>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Rating */}
              <tr className="border-b border-border/30 bg-muted/20">
                <td className="px-6 py-3 text-sm font-medium">Rating</td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-center">
                    <div className="flex justify-center">
                      <RatingStars rating={t.avg_rating} count={t.review_count} />
                    </div>
                  </td>
                ))}
              </tr>

              {/* Pricing */}
              <tr className="border-b border-border/30">
                <td className="px-6 py-3 text-sm font-medium">Pricing</td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn('text-xs font-bold', PRICING_BADGE_COLORS[t.pricing_model] ?? '')}
                      >
                        {PRICING_LABELS[t.pricing_model] ?? 'Unknown'}
                      </Badge>
                      {t.pricing_tags && t.pricing_tags.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1">
                          {t.pricing_tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {t.pricing_details && (
                        <p className="text-xs text-muted-foreground max-w-[200px]">{t.pricing_details}</p>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Category */}
              <tr className="border-b border-border/30 bg-muted/20">
                <td className="px-6 py-3 text-sm font-medium">Category</td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-sm text-center">
                    {t.categories ? (
                      <Link href={`/categories/${t.categories.slug}`} className="text-primary hover:underline font-medium">
                        {t.categories.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Uncategorized</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Use Case */}
              <tr className="border-b border-border/30">
                <td className="px-6 py-3 text-sm font-medium">Use Case</td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {t.use_case && USE_CASE_LABELS[t.use_case] ? (
                        <Badge variant="secondary" className="text-xs">{USE_CASE_LABELS[t.use_case]}</Badge>
                      ) : t.use_cases && t.use_cases.length > 0 ? (
                        t.use_cases.slice(0, 3).map((uc) => (
                          <Badge key={uc} variant="secondary" className="text-xs">{uc}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Feature rows with icons */}
              <tr className="border-b border-border/30 bg-muted/20">
                <td className="px-6 py-3 text-sm font-medium flex items-center gap-2">
                  <Code className="h-3.5 w-3.5 text-muted-foreground" /> Has API
                </td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-center">
                    <div className="flex justify-center"><BooleanIcon value={t.has_api} /></div>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border/30">
                <td className="px-6 py-3 text-sm font-medium flex items-center gap-2">
                  <Smartphone className="h-3.5 w-3.5 text-muted-foreground" /> Mobile App
                </td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-center">
                    <div className="flex justify-center"><BooleanIcon value={t.has_mobile_app} /></div>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border/30 bg-muted/20">
                <td className="px-6 py-3 text-sm font-medium flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Open Source
                </td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-center">
                    <div className="flex justify-center"><BooleanIcon value={t.is_open_source} /></div>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border/30">
                <td className="px-6 py-3 text-sm font-medium flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" /> SSO Support
                </td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-center">
                    <div className="flex justify-center"><BooleanIcon value={t.has_sso} /></div>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border/30 bg-muted/20">
                <td className="px-6 py-3 text-sm font-medium">Trains on Your Data</td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-center">
                    <div className="flex justify-center"><BooleanIcon value={t.trains_on_data} /></div>
                  </td>
                ))}
              </tr>

              {/* Team Size */}
              <tr className="border-b border-border/30">
                <td className="px-6 py-3 text-sm font-medium">Team Size</td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-sm text-center">
                    {t.team_size ? (
                      <span className="font-medium">{TEAM_SIZE_LABELS[t.team_size] ?? t.team_size}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Deployment */}
              <tr className="border-b border-border/30 bg-muted/20">
                <td className="px-6 py-3 text-sm font-medium flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-muted-foreground" /> Deployment
                </td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-sm text-center">
                    {t.deployment_type ? (
                      <span className="font-medium">{DEPLOYMENT_LABELS[t.deployment_type] ?? t.deployment_type}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Time to Value */}
              <tr className="border-b border-border/30">
                <td className="px-6 py-3 text-sm font-medium">Time to Value</td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-sm text-center">
                    {t.time_to_value ? (
                      <span className="font-medium">{TIME_TO_VALUE_LABELS[t.time_to_value] ?? t.time_to_value}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Target Audience */}
              <tr className="border-b border-border/30 bg-muted/20">
                <td className="px-6 py-3 text-sm font-medium">Best For</td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-sm text-center">
                    {t.target_audience ? (
                      <span className="font-medium capitalize">{t.target_audience.replace(/-/g, ' ')}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Integrations */}
              {(toolA.integrations?.length || toolB.integrations?.length) ? (
                <tr className="border-b border-border/30">
                  <td className="px-6 py-3 text-sm font-medium">Integrations</td>
                  {tools.map((t) => (
                    <td key={t.id} className="px-6 py-3 text-center">
                      {t.integrations && t.integrations.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-1 max-w-[220px] mx-auto">
                          {t.integrations.slice(0, 6).map((int) => (
                            <span key={int} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              {int}
                            </span>
                          ))}
                          {t.integrations.length > 6 && (
                            <span className="text-[10px] text-muted-foreground font-bold">+{t.integrations.length - 6} more</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ) : null}

              {/* Verified */}
              <tr className="bg-muted/20">
                <td className="px-6 py-3 text-sm font-medium">Verified</td>
                {tools.map((t) => (
                  <td key={t.id} className="px-6 py-3 text-center">
                    <div className="flex justify-center"><BooleanIcon value={t.is_verified} /></div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {tools.map((tool) => (
          <div key={tool.id} className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                {tool.logo_url ? (
                  <img src={tool.logo_url} alt={tool.name} width={40} height={40} className="object-contain" />
                ) : (
                  <span className="text-lg font-black text-primary">{tool.name[0]}</span>
                )}
              </div>
              <h3 className="font-bold text-lg">{tool.name}</h3>
            </div>
            {tool.pros?.length ? (
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                  Pros
                </p>
                <ul className="space-y-1.5">
                  {tool.pros.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {tool.cons?.length ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
                  Cons
                </p>
                <ul className="space-y-1.5">
                  {tool.cons.map((con, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-5 pt-4 border-t border-border/30">
              <Link href={`/tools/${tool.slug}`}>
                <Button variant="outline" size="sm" className="gap-2 w-full">
                  View Full Details <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Similar Tools */}
      {similar.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-bold mb-4">Similar Tools to Consider</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {similar.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-primary/25 hover:shadow-md transition-all group"
              >
                {tool.logo_url ? (
                  <img src={tool.logo_url} alt={tool.name} className="w-10 h-10 rounded-lg object-contain" />
                ) : (
                  <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{tool.name?.[0] ?? '?'}</span>
                )}
                <p className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">{tool.name}</p>
                {tool.avg_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-xs">{tool.avg_rating.toFixed(1)}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="text-center glass-card rounded-xl p-8">
        <h2 className="text-xl font-bold mb-2">Need a deeper comparison?</h2>
        <p className="text-muted-foreground mb-6">
          Use our full comparison tool to compare up to 4 tools across every
          dimension.
        </p>
        <Link href={`/compare?tools=${toolA.slug},${toolB.slug}`}>
          <Button size="lg" className="gap-2 font-bold">
            Open Full Compare <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
