import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Star, ExternalLink, ArrowRight, Check, ChevronDown } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/common/JsonLd'
import { PRICING_LABELS, PRICING_BADGE_COLORS } from '@/lib/constants'
import { SITE_URL } from '@/lib/constants/site'
import { BEST_PAGE_CONFIGS, getAllBestPageSlugs } from '@/lib/constants/best-pages'
import { cn } from '@/lib/utils'
import { OutboundLink } from '@/components/common/OutboundLink'

type BestTool = {
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
  pros: string[] | null
  pricing_details: string | null
  pricing_tags: string[] | null
  categories: { name: string; slug: string } | null
}

const BEST_TOOL_SELECT =
  'id, name, slug, tagline, logo_url, website_url, pricing_model, avg_rating, review_count, is_verified, is_open_source, has_api, pros, pricing_details, pricing_tags, categories:category_id(name, slug)'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllBestPageSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const config = BEST_PAGE_CONFIGS[slug]
  if (!config) return {}

  const year = new Date().getFullYear()
  const title = `${config.title} in ${year} | AIPowerStacks`

  return {
    title,
    description: config.description,
    alternates: { canonical: `/best/${slug}` },
    openGraph: {
      title,
      description: config.description,
      url: `${SITE_URL}/best/${slug}`,
    },
  }
}

export default async function BestPage({ params }: Props) {
  const { slug } = await params
  const config = BEST_PAGE_CONFIGS[slug]
  if (!config) notFound()

  const supabase = createAdminClient()
  const year = new Date().getFullYear()

  // Build query based on config
  let query = supabase
    .from('tools')
    .select(BEST_TOOL_SELECT)
    .eq('status', 'published')

  if (config.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', config.categorySlug)
      .single()

    if (cat) {
      query = query.eq('category_id', cat.id)
    }
  }

  if (config.pricingFilter) {
    query = query.eq('pricing_model', config.pricingFilter as 'free' | 'freemium' | 'paid' | 'trial' | 'contact' | 'unknown')
  }

  query = query
    .order('avg_rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(20)

  const { data: rawTools } = await query
  const tools = (rawTools ?? []) as unknown as BestTool[]

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Best AI Tools', item: `${SITE_URL}/best` },
      { '@type': 'ListItem', position: 3, name: config.title, item: `${SITE_URL}/best/${slug}` },
    ],
  }

  const itemListJsonLd = tools.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${config.title} in ${year}`,
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tool.name,
      url: `${SITE_URL}/tools/${tool.slug}`,
    })),
  } : null

  return (
    <div className="page-shell max-w-5xl mx-auto pb-24">
      <JsonLd data={breadcrumbJsonLd} />
      {itemListJsonLd && <JsonLd data={itemListJsonLd} />}

      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground mb-8 flex items-center gap-1.5">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link href="/best" className="hover:text-foreground transition-colors">Best AI Tools</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{config.title}</span>
      </nav>

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          {tools.length} {config.heading} in {year}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {config.description}
        </p>
      </div>

      {/* Tool grid */}
      {tools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {tools.map((tool, index) => (
            <div key={tool.id} className="glass-card rounded-xl p-5 flex flex-col hover:border-primary/25 hover:shadow-md transition-all">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-xs font-bold text-muted-foreground bg-muted rounded-full h-6 w-6 flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {tool.logo_url ? (
                    <img src={tool.logo_url} alt={tool.name} width={40} height={40} className="object-contain" />
                  ) : (
                    <span className="text-sm font-black text-primary">{tool.name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link href={`/tools/${tool.slug}`} className="font-bold hover:text-primary transition-colors">
                      {tool.name}
                    </Link>
                    {tool.is_verified && (
                      <Badge variant="secondary" className="text-[10px]">Verified</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{tool.tagline}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <Badge
                  variant="outline"
                  className={cn('text-[10px] font-bold', PRICING_BADGE_COLORS[tool.pricing_model] ?? '')}
                >
                  {PRICING_LABELS[tool.pricing_model] ?? 'Unknown'}
                </Badge>
                {tool.avg_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-xs font-medium">{tool.avg_rating.toFixed(1)}</span>
                    <span className="text-[10px] text-muted-foreground">({tool.review_count})</span>
                  </div>
                )}
                {tool.is_open_source && (
                  <Badge variant="outline" className="text-[10px]">Open Source</Badge>
                )}
                {tool.has_api && (
                  <Badge variant="outline" className="text-[10px]">API</Badge>
                )}
              </div>

              {/* Pros */}
              {tool.pros && tool.pros.length > 0 && (
                <ul className="space-y-1 mb-3">
                  {tool.pros.slice(0, 3).map((pro, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs">
                      <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              )}

              {tool.pricing_tags && tool.pricing_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {tool.pricing_tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center gap-2">
                <Link href={`/tools/${tool.slug}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                    View Details <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
                <OutboundLink href={tool.website_url} toolName={tool.name} toolSlug={tool.slug} placement="best-list">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    Visit <ExternalLink className="h-3 w-3" />
                  </Button>
                </OutboundLink>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 mb-12">
          <p className="text-muted-foreground">No tools found in this category yet. Check back soon!</p>
        </div>
      )}

      {/* FAQ */}
      {config.faq.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: config.faq.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: item.a,
                },
              })),
            }}
          />
          <div className="space-y-3">
            {config.faq.map((item, i) => (
              <details key={i} className="glass-card rounded-xl group" open={i === 0}>
                <summary className="px-5 py-4 cursor-pointer flex items-center justify-between gap-3 font-medium text-sm list-none [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-4 text-sm text-muted-foreground">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Browse more */}
      <div className="text-center glass-card rounded-xl p-8">
        <h2 className="text-xl font-bold mb-2">Explore More AI Tool Categories</h2>
        <p className="text-muted-foreground mb-6">
          Browse all categories to find the perfect AI tool for your needs.
        </p>
        <Link href="/best">
          <Button size="lg" className="gap-2 font-bold">
            Browse All Categories <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
