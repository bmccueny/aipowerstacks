import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ExternalLink, Check, DollarSign, Star } from 'lucide-react'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/common/JsonLd'
import { PRICING_LABELS, PRICING_BADGE_COLORS } from '@/lib/constants'
import { SITE_URL } from '@/lib/constants/site'
import { cn } from '@/lib/utils'
import { OutboundLink } from '@/components/common/OutboundLink'

export const revalidate = 86400

interface Props {
  params: Promise<{ slug: string }>
}

type PricingTier = {
  id: string
  tool_id: string
  tier_name: string
  monthly_price: number
  annual_price: number | null
  features: string | null
  sort_order: number | null
  last_verified_at: string | null
  updated_at: string
}

type ToolRow = {
  id: string
  name: string
  slug: string
  tagline: string
  description: string | null
  logo_url: string | null
  website_url: string
  pricing_model: string
  avg_rating: number
  review_count: number
  category_id: string
}

type AltTool = {
  id: string
  name: string
  slug: string
  tagline: string
  logo_url: string | null
  pricing_model: string
  avg_rating: number
  review_count: number
}

function parseFeatures(raw: string | null): string[] {
  if (!raw) return []
  if (raw.includes('|')) return raw.split('|').map((f) => f.trim()).filter((f) => f.length > 0)
  return raw.split('\n').map((f) => f.trim()).filter((f) => f.length > 0)
}

function formatPrice(price: number): string {
  if (price === 0) return 'Free'
  return `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`
}

function annualSavings(monthly: number, annual: number): number {
  return Math.round(((monthly * 12 - annual * 12) / (monthly * 12)) * 100)
}

export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data: tiers } = await supabase
    .from('tool_pricing_tiers')
    .select('tool_id')

  if (!tiers || tiers.length === 0) return []

  const toolIds = [...new Set(tiers.map((t) => t.tool_id))]

  const { data: tools } = await supabase
    .from('tools')
    .select('slug')
    .eq('status', 'published')
    .in('id', toolIds)

  return (tools ?? []).map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: toolData } = await supabase
    .from('tools')
    .select('id, name, tagline')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!toolData) return {}

  const { data: tiers } = await supabase
    .from('tool_pricing_tiers')
    .select('tier_name, monthly_price')
    .eq('tool_id', toolData.id)
    .order('monthly_price', { ascending: true })

  const tierList = tiers ?? []
  const cheapestPaid = tierList.find((t) => t.monthly_price > 0)
  const tierNames = tierList.slice(0, 3).map((t) => t.tier_name).join(', ')

  const title = `${toolData.name} Pricing 2026: Plans, Costs & Alternatives | AIPowerStacks`
  const description = cheapestPaid
    ? `${toolData.name} pricing starts at $${cheapestPaid.monthly_price}/mo. Compare all ${tierList.length} plan${tierList.length !== 1 ? 's' : ''} including ${tierNames}. See alternatives and save money.`
    : `${toolData.name} pricing: compare all ${tierList.length} plan${tierList.length !== 1 ? 's' : ''} including ${tierNames}. See alternatives and save money.`

  return {
    title,
    description,
    alternates: { canonical: `/pricing/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/pricing/${slug}`,
    },
  }
}

export default async function PricingSlugPage({ params }: Props) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: toolData } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, description, logo_url, website_url, pricing_model, avg_rating, review_count, category_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!toolData) notFound()

  const tool = toolData as unknown as ToolRow

  const [tiersRes, altRes] = await Promise.all([
    supabase
      .from('tool_pricing_tiers')
      .select('id, tool_id, tier_name, monthly_price, annual_price, features, sort_order, last_verified_at, updated_at')
      .eq('tool_id', tool.id)
      .order('sort_order', { ascending: true })
      .order('monthly_price', { ascending: true }),
    supabase
      .from('tools')
      .select('id, name, slug, tagline, logo_url, pricing_model, avg_rating, review_count')
      .eq('status', 'published')
      .eq('category_id', tool.category_id)
      .neq('slug', slug)
      .gte('review_count', 2)
      .order('avg_rating', { ascending: false })
      .limit(5),
  ])

  const tiers = (tiersRes.data ?? []) as unknown as PricingTier[]
  const alts = (altRes.data ?? []) as unknown as AltTool[]

  // Fetch cheapest paid tier for each alternative
  const altIds = alts.map((a) => a.id)
  const { data: altTiersData } = altIds.length > 0
    ? await supabase
        .from('tool_pricing_tiers')
        .select('tool_id, monthly_price, tier_name')
        .in('tool_id', altIds)
        .gt('monthly_price', 0)
        .order('monthly_price', { ascending: true })
    : { data: [] }

  const altCheapest = new Map<string, { monthly_price: number; tier_name: string }>()
  for (const t of altTiersData ?? []) {
    if (!altCheapest.has(t.tool_id)) {
      altCheapest.set(t.tool_id, { monthly_price: t.monthly_price, tier_name: t.tier_name })
    }
  }

  const hasFree = tiers.some((t) => t.monthly_price === 0)
  const cheapestPaid = tiers.find((t) => t.monthly_price > 0)
  const lastVerified = tiers.find((t) => t.last_verified_at)?.last_verified_at
  const updatedAt = tiers.find((t) => t.updated_at)?.updated_at

  // JSON-LD: SoftwareApplication
  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.tagline,
    url: tool.website_url,
    image: tool.logo_url ?? undefined,
    aggregateRating: tool.review_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: tool.avg_rating.toFixed(1),
      reviewCount: tool.review_count,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
    offers: tiers.map((t) => ({
      '@type': 'Offer',
      name: t.tier_name,
      price: t.monthly_price.toFixed(2),
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: t.monthly_price.toFixed(2),
        priceCurrency: 'USD',
        unitText: 'MONTH',
      },
    })),
  }

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${SITE_URL}/tools` },
      { '@type': 'ListItem', position: 3, name: tool.name, item: `${SITE_URL}/tools/${tool.slug}` },
      { '@type': 'ListItem', position: 4, name: 'Pricing', item: `${SITE_URL}/pricing/${tool.slug}` },
    ],
  }

  // JSON-LD: FAQ
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How much does ${tool.name} cost?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: cheapestPaid
            ? `${tool.name} pricing starts at $${cheapestPaid.monthly_price}/month for the ${cheapestPaid.tier_name} plan.${hasFree ? ` There is also a free plan available.` : ''}`
            : hasFree
            ? `${tool.name} is free to use.`
            : `${tool.name} offers ${tiers.length} pricing plan${tiers.length !== 1 ? 's' : ''}. Visit their website for current pricing.`,
        },
      },
      {
        '@type': 'Question',
        name: `Does ${tool.name} have a free plan?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: hasFree
            ? `Yes, ${tool.name} offers a free plan.`
            : `No, ${tool.name} does not currently offer a free plan. The cheapest option starts at $${cheapestPaid?.monthly_price ?? 'N/A'}/month.`,
        },
      },
      {
        '@type': 'Question',
        name: `What are the best alternatives to ${tool.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: alts.length > 0
            ? `The top alternatives to ${tool.name} include: ${alts.slice(0, 3).map((a) => a.name).join(', ')}. See the full comparison at AIPowerStacks.`
            : `See the full list of ${tool.name} alternatives at AIPowerStacks.`,
        },
      },
    ],
  }

  const displayRating = tool.avg_rating.toFixed(1)
  const fullStars = Math.round(tool.avg_rating)

  return (
    <div className="page-shell max-w-4xl mx-auto pb-24">
      <JsonLd data={appJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />

      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground mb-8 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground transition-colors">Tools</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/tools/${tool.slug}`} className="hover:text-foreground transition-colors">{tool.name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Pricing</span>
      </nav>

      {/* Tool header */}
      <div className="glass-card rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center shrink-0">
            {tool.logo_url ? (
              <img src={tool.logo_url} alt={tool.name} width={56} height={56} className="object-contain" />
            ) : (
              <span className="text-xl font-black text-primary">{tool.name[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-black tracking-tight">{tool.name} Pricing</h1>
              <Badge
                variant="outline"
                className={cn('text-xs font-bold', PRICING_BADGE_COLORS[tool.pricing_model] ?? '')}
              >
                {PRICING_LABELS[tool.pricing_model] ?? tool.pricing_model}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mb-2">{tool.tagline}</p>
            <div className="flex items-center gap-3 flex-wrap">
              {tool.review_count > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn('h-3.5 w-3.5', i < fullStars ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{displayRating}</span>
                  <span className="text-xs text-muted-foreground">({tool.review_count} reviews)</span>
                </div>
              )}
              <Link
                href={`/tools/${tool.slug}`}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View full profile
              </Link>
              <OutboundLink
                href={tool.website_url}
                toolName={tool.name}
                toolSlug={tool.slug}
                placement="pricing-header"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                Website <ExternalLink className="h-3 w-3" />
              </OutboundLink>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing tiers */}
      <section className="mb-12">
        <h2 className="text-xl font-black tracking-tight mb-4">
          {tool.name} Plans &amp; Pricing
        </h2>

        {tiers.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p>No pricing tiers available yet.</p>
            <OutboundLink
              href={tool.website_url}
              toolName={tool.name}
              toolSlug={tool.slug}
              placement="pricing-empty"
              className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
            >
              Check {tool.name} website <ExternalLink className="h-3 w-3" />
            </OutboundLink>
          </div>
        ) : (
          <div className={cn('grid gap-4', tiers.length === 1 ? 'grid-cols-1 max-w-sm' : tiers.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
            {tiers.map((tier) => {
              const features = parseFeatures(tier.features)
              const isFree = tier.monthly_price === 0
              const savings = tier.annual_price != null && tier.monthly_price > 0
                ? annualSavings(tier.monthly_price, tier.annual_price)
                : null

              return (
                <div key={tier.id} className="glass-card rounded-xl p-5 flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-black text-lg tracking-tight mb-1">{tier.tier_name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black">
                        {isFree ? 'Free' : `$${tier.monthly_price % 1 === 0 ? tier.monthly_price.toFixed(0) : tier.monthly_price.toFixed(2)}`}
                      </span>
                      {!isFree && <span className="text-sm text-muted-foreground">/mo</span>}
                    </div>
                    {tier.annual_price != null && !isFree && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {tier.annual_price % 1 === 0
                            ? `$${(tier.annual_price * 12).toFixed(0)}`
                            : `$${(tier.annual_price * 12).toFixed(2)}`}/yr
                        </span>
                        {savings != null && savings > 0 && (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-600/30 font-bold">
                            Save {savings}%
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {features.length > 0 && (
                    <ul className="flex-1 space-y-2 mb-4">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <OutboundLink
                    href={tool.website_url}
                    toolName={tool.name}
                    toolSlug={tool.slug}
                    placement="pricing-tier"
                    className="mt-auto"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      Get {tier.tier_name} <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </OutboundLink>
                </div>
              )
            })}
          </div>
        )}

        {/* Track CTA */}
        <div className="mt-6 flex items-center gap-3">
          <Link href={`/tracker?add=${tool.slug}`}>
            <Button size="sm">
              Track this tool
            </Button>
          </Link>
          {lastVerified && (
            <span className="text-xs text-muted-foreground">
              Pricing verified {new Date(lastVerified).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          )}
          {!lastVerified && updatedAt && (
            <span className="text-xs text-muted-foreground">
              Last updated {new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
      </section>

      {/* Alternatives */}
      {alts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-black tracking-tight mb-4">
            Compare Alternatives to {tool.name}
          </h2>
          <div className="space-y-3">
            {alts.map((alt) => {
              const cheapest = altCheapest.get(alt.id)
              const altStars = Math.round(alt.avg_rating)
              return (
                <Link
                  key={alt.id}
                  href={`/pricing/${alt.slug}`}
                  className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors group block"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {alt.logo_url ? (
                      <img src={alt.logo_url} alt={alt.name} width={40} height={40} className="object-contain" />
                    ) : (
                      <span className="text-sm font-black text-primary">{alt.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm group-hover:text-primary transition-colors">{alt.name}</span>
                      <Badge
                        variant="outline"
                        className={cn('text-xs font-bold', PRICING_BADGE_COLORS[alt.pricing_model] ?? '')}
                      >
                        {PRICING_LABELS[alt.pricing_model] ?? alt.pricing_model}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{alt.tagline}</p>
                    {alt.review_count > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn('h-3 w-3', i < altStars ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{alt.avg_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {cheapest ? (
                      <>
                        <div className="text-sm font-black">{formatPrice(cheapest.monthly_price)}</div>
                        <div className="text-xs text-muted-foreground">/mo</div>
                      </>
                    ) : (
                      <div className="text-sm font-black text-emerald-600">Free</div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="mt-4">
            <Link href={`/alternatives/to-${tool.slug}`} className="text-sm text-primary hover:underline">
              See all {tool.name} alternatives →
            </Link>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-black tracking-tight mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-bold mb-2">How much does {tool.name} cost?</h3>
            <p className="text-sm text-muted-foreground">
              {cheapestPaid
                ? `${tool.name} pricing starts at $${cheapestPaid.monthly_price}/month for the ${cheapestPaid.tier_name} plan.${hasFree ? ` There is also a free plan available.` : ''}`
                : hasFree
                ? `${tool.name} is free to use.`
                : `${tool.name} offers ${tiers.length} pricing plan${tiers.length !== 1 ? 's' : ''}. Visit their website for current pricing.`}
            </p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-bold mb-2">Does {tool.name} have a free plan?</h3>
            <p className="text-sm text-muted-foreground">
              {hasFree
                ? `Yes, ${tool.name} offers a free plan. You can get started without a credit card.`
                : `No, ${tool.name} does not currently offer a free plan. The cheapest paid option starts at $${cheapestPaid?.monthly_price ?? 'N/A'}/month.`}
            </p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-bold mb-2">What are the best alternatives to {tool.name}?</h3>
            <p className="text-sm text-muted-foreground">
              {alts.length > 0
                ? `Top alternatives to ${tool.name} include ${alts.slice(0, 3).map((a) => a.name).join(', ')}. Compare pricing and features on AIPowerStacks.`
                : `Browse alternatives to ${tool.name} on AIPowerStacks to find the best fit for your workflow.`}
            </p>
            {alts.length > 0 && (
              <Link href={`/alternatives/to-${tool.slug}`} className="text-sm text-primary hover:underline mt-2 block">
                Compare {tool.name} alternatives →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Last updated footer */}
      <p className="text-xs text-muted-foreground text-center">
        Pricing data last updated {updatedAt
          ? new Date(updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.{' '}
        Always verify pricing on{' '}
        <OutboundLink href={tool.website_url} toolName={tool.name} toolSlug={tool.slug} placement="pricing-disclaimer" className="text-primary hover:underline">
          {tool.name}&apos;s website
        </OutboundLink>.
      </p>
    </div>
  )
}
