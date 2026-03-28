import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Star, ExternalLink, ArrowRight, Check } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/common/JsonLd'
import { PRICING_LABELS, PRICING_BADGE_COLORS } from '@/lib/constants'
import { SITE_URL } from '@/lib/constants/site'
import { cn } from '@/lib/utils'

type AlternativeTool = {
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

const ALT_TOOL_SELECT =
  'id, name, slug, tagline, logo_url, website_url, pricing_model, avg_rating, review_count, is_verified, is_open_source, has_api, pros, pricing_details, pricing_tags, categories:category_id(name, slug)'

function parseAlternativesSlug(slug: string): string | null {
  if (!slug.startsWith('to-')) return null
  return slug.slice(3)
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tools')
    .select('slug')
    .eq('status', 'published')
    .order('upvote_count', { ascending: false })
    .limit(200)
  return (data ?? []).map((t) => ({ slug: `to-${t.slug}` }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const toolSlug = parseAlternativesSlug(slug)
  if (!toolSlug) return {}

  const supabase = createAdminClient()
  const { data: tool } = await supabase
    .from('tools')
    .select('name, tagline')
    .eq('slug', toolSlug)
    .eq('status', 'published')
    .single()

  if (!tool) return {}

  const title = `Best ${tool.name} Alternatives in ${new Date().getFullYear()} | AIPowerStacks`
  const description = `Looking for ${tool.name} alternatives? Compare the best options with pricing, features, and ratings to find the perfect replacement.`

  return {
    title,
    description,
    alternates: { canonical: `/alternatives/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/alternatives/${slug}`,
    },
  }
}

export default async function AlternativesPage({ params }: Props) {
  const { slug } = await params
  const toolSlug = parseAlternativesSlug(slug)
  if (!toolSlug) notFound()

  const supabase = createAdminClient()

  const { data: targetTool } = await supabase
    .from('tools')
    .select(ALT_TOOL_SELECT)
    .eq('slug', toolSlug)
    .eq('status', 'published')
    .single()

  if (!targetTool) notFound()

  const tool = targetTool as unknown as AlternativeTool

  // Find alternatives in the same category
  let alternatives: AlternativeTool[] = []
  if (tool.categories) {
    const { data: catData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', tool.categories.slug)
      .single()

    if (catData) {
      const { data: altData } = await supabase
        .from('tools')
        .select(ALT_TOOL_SELECT)
        .eq('status', 'published')
        .eq('category_id', catData.id)
        .neq('slug', toolSlug)
        .order('avg_rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(20)

      alternatives = (altData ?? []) as unknown as AlternativeTool[]
    }
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Alternatives', item: `${SITE_URL}/alternatives` },
      { '@type': 'ListItem', position: 3, name: `${tool.name} Alternatives`, item: `${SITE_URL}/alternatives/${slug}` },
    ],
  }

  const itemListJsonLd = alternatives.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Best ${tool.name} Alternatives`,
    numberOfItems: alternatives.length,
    itemListElement: alternatives.map((alt, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: alt.name,
      url: `${SITE_URL}/tools/${alt.slug}`,
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
        <Link href="/alternatives" className="hover:text-foreground transition-colors">Alternatives</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{tool.name}</span>
      </nav>

      {/* Hero */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
            {tool.logo_url ? (
              <img src={tool.logo_url} alt={tool.name} width={64} height={64} className="object-contain" />
            ) : (
              <span className="text-2xl font-black text-primary">{tool.name[0]}</span>
            )}
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          Best {tool.name} Alternatives
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {tool.tagline}. Explore {alternatives.length} alternative{alternatives.length !== 1 ? 's' : ''} to find
          the right tool for your needs.
        </p>
      </div>

      {/* Target tool summary */}
      <div className="glass-card rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
            {tool.logo_url ? (
              <img src={tool.logo_url} alt={tool.name} width={48} height={48} className="object-contain" />
            ) : (
              <span className="text-lg font-black text-primary">{tool.name[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-lg">{tool.name}</h2>
              <Badge
                variant="outline"
                className={cn('text-xs font-bold', PRICING_BADGE_COLORS[tool.pricing_model] ?? '')}
              >
                {PRICING_LABELS[tool.pricing_model] ?? 'Unknown'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{tool.tagline}</p>
            <div className="flex items-center gap-4 text-sm">
              {tool.avg_rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span className="font-medium">{tool.avg_rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({tool.review_count})</span>
                </div>
              )}
              {tool.categories && (
                <Link href={`/categories/${tool.categories.slug}`} className="text-primary hover:underline">
                  {tool.categories.name}
                </Link>
              )}
            </div>
          </div>
          <Link href={`/tools/${tool.slug}`}>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
              View <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Alternatives grid */}
      {alternatives.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">
            {alternatives.length} Alternative{alternatives.length !== 1 ? 's' : ''} to {tool.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alternatives.map((alt, index) => (
              <div key={alt.id} className="glass-card rounded-xl p-5 flex flex-col hover:border-primary/25 hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-xs font-bold text-muted-foreground mt-1">#{index + 1}</span>
                  <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {alt.logo_url ? (
                      <img src={alt.logo_url} alt={alt.name} width={40} height={40} className="object-contain" />
                    ) : (
                      <span className="text-sm font-black text-primary">{alt.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link href={`/tools/${alt.slug}`} className="font-bold hover:text-primary transition-colors">
                        {alt.name}
                      </Link>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-bold', PRICING_BADGE_COLORS[alt.pricing_model] ?? '')}
                      >
                        {PRICING_LABELS[alt.pricing_model] ?? 'Unknown'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{alt.tagline}</p>
                  </div>
                </div>

                {/* Rating */}
                {alt.avg_rating > 0 && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-3 w-3',
                            i < Math.floor(alt.avg_rating)
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium">{alt.avg_rating.toFixed(1)}</span>
                    <span className="text-[10px] text-muted-foreground">({alt.review_count} reviews)</span>
                  </div>
                )}

                {/* Pros */}
                {alt.pros && alt.pros.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {alt.pros.slice(0, 3).map((pro, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Pricing details */}
                {alt.pricing_details && (
                  <p className="text-xs text-muted-foreground mb-3">{alt.pricing_details}</p>
                )}

                <div className="mt-auto flex items-center gap-2">
                  <Link href={`/tools/${alt.slug}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                      View Details <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                  <a href={alt.website_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                      Visit <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No alternatives found yet. Check back soon!</p>
        </div>
      )}

      {/* Compare CTA */}
      {alternatives.length > 0 && (
        <div className="text-center glass-card rounded-xl p-8 mt-12">
          <h2 className="text-xl font-bold mb-2">Want a detailed comparison?</h2>
          <p className="text-muted-foreground mb-6">
            Compare {tool.name} side-by-side with any alternative.
          </p>
          <Link href={`/compare?tools=${tool.slug},${alternatives[0].slug}`}>
            <Button size="lg" className="gap-2 font-bold">
              Compare Tools <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
