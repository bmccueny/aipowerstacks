import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Star, ArrowRight, Check, X, ArrowLeftRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/common/JsonLd'
import { PRICING_LABELS, PRICING_BADGE_COLORS } from '@/lib/constants'
import { SITE_URL } from '@/lib/constants/site'

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
  model_provider: string | null
  is_api_wrapper: boolean
  use_cases: string[] | null
  pros: string[] | null
  cons: string[] | null
  pricing_tags: string[] | null
  pricing_details: string | null
  categories: { name: string; slug: string } | null
}

const TOOL_SELECT =
  'id, name, slug, tagline, logo_url, website_url, pricing_model, avg_rating, review_count, is_verified, is_open_source, has_api, model_provider, is_api_wrapper, use_cases, pros, cons, pricing_tags, pricing_details, categories:category_id(name, slug)'

function parseVsSlug(slug: string): [string, string] | null {
  const parts = slug.split('-vs-')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  return [parts[0], parts[1]]
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

  const comparisonRows = [
    {
      label: 'Pricing',
      render: (t: VsTool) => PRICING_LABELS[t.pricing_model] ?? 'Unknown',
    },
    {
      label: 'Rating',
      render: (t: VsTool) =>
        t.avg_rating > 0 ? `${t.avg_rating.toFixed(1)} / 5` : 'No ratings yet',
    },
    {
      label: 'Reviews',
      render: (t: VsTool) => `${t.review_count} reviews`,
    },
    {
      label: 'Category',
      render: (t: VsTool) => t.categories?.name ?? 'Uncategorized',
    },
    {
      label: 'Has API',
      render: (t: VsTool) => (t.has_api ? 'Yes' : 'No'),
    },
    {
      label: 'Open Source',
      render: (t: VsTool) => (t.is_open_source ? 'Yes' : 'No'),
    },
    {
      label: 'Verified',
      render: (t: VsTool) => (t.is_verified ? 'Yes' : 'No'),
    },
  ]

  return (
    <div className="page-shell max-w-4xl mx-auto pb-24">
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

      {/* Tool cards side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {tools.map((tool) => (
          <div key={tool.id} className="glass-card rounded-xl p-6 text-center">
            <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center mx-auto mb-4">
              {tool.logo_url ? (
                <img
                  src={tool.logo_url}
                  alt={tool.name}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              ) : (
                <span className="text-2xl font-black text-primary">
                  {tool.name[0]}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold mb-1">{tool.name}</h2>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {tool.tagline}
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              {tool.avg_rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-bold">{tool.avg_rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({tool.review_count})
                  </span>
                </div>
              )}
              <Badge
                variant="outline"
                className={PRICING_BADGE_COLORS[tool.pricing_model] ?? ''}
              >
                {PRICING_LABELS[tool.pricing_model] ?? 'Unknown'}
              </Badge>
            </div>
            <Link href={`/tools/${tool.slug}`}>
              <Button variant="outline" size="sm" className="gap-2">
                View Details <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="glass-card rounded-xl overflow-hidden mb-12">
        <div className="px-6 py-4 border-b border-border/50">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" /> Feature
            Comparison
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Feature
                </th>
                <th className="text-center px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {toolA.name}
                </th>
                <th className="text-center px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {toolB.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="px-6 py-3 text-sm font-medium">{row.label}</td>
                  <td className="px-6 py-3 text-sm text-center">
                    {row.render(toolA)}
                  </td>
                  <td className="px-6 py-3 text-sm text-center">
                    {row.render(toolB)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {tools.map((tool) => (
          <div key={tool.id} className="glass-card rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">{tool.name}</h3>
            {tool.pros?.length ? (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
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
                <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2">
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
          </div>
        ))}
      </div>

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
