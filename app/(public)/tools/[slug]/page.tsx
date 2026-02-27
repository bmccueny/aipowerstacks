import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, ShieldCheck, Star, Tag, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getToolBySlug } from '@/lib/supabase/queries/tools'
import { getReviewsByTool } from '@/lib/supabase/queries/reviews'
import { generateToolMetadata, generateJsonLd } from '@/lib/utils/seo'
import { JsonLd } from '@/components/common/JsonLd'
import { StarRating } from '@/components/reviews/StarRating'
import { BookmarkButton } from '@/components/tools/BookmarkButton'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const tool = await getToolBySlug(slug)
  if (!tool) return {}
  return generateToolMetadata(tool)
}

export default async function ToolDetailPage({ params }: Props) {
  const { slug } = await params
  const [tool, reviews] = await Promise.all([
    getToolBySlug(slug),
    getToolBySlug(slug).then((t) => t ? getReviewsByTool(t.id) : []),
  ])

  if (!tool) notFound()

  const screenshots = Array.isArray(tool.screenshot_urls) ? tool.screenshot_urls as string[] : []
  const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
  const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'

  return (
    <>
      <JsonLd data={generateJsonLd(tool)} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/tools" className="hover:text-foreground transition-colors">Tools</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{tool.name}</span>
        </nav>

        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-white/10 overflow-hidden flex items-center justify-center">
              {tool.logo_url ? (
                <Image src={tool.logo_url} alt={tool.name} width={80} height={80} className="object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary">{tool.name[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <h1 className="text-2xl font-bold">{tool.name}</h1>
                {tool.is_verified && (
                  <div className="flex items-center gap-1 text-emerald-400 text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground mb-3">{tool.tagline}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className={pricingColor}>{pricingLabel}</Badge>
                {tool.is_featured && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">Featured</Badge>
                )}
                {tool.is_supertools && (
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">SuperTool</Badge>
                )}
                {tool.categories && (
                  <Link href={`/categories/${tool.categories.slug}`}>
                    <Badge variant="outline" className="border-white/20 hover:border-primary/50 transition-colors">
                      {tool.categories.icon} {tool.categories.name}
                    </Badge>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <a href={tool.website_url} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2">
                    Visit {tool.name}
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                <BookmarkButton toolId={tool.id} />
                {tool.avg_rating > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={tool.avg_rating} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {tool.avg_rating.toFixed(1)} ({tool.review_count} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-3">About {tool.name}</h2>
              <p className="text-muted-foreground leading-relaxed">{tool.description}</p>
            </div>

            {tool.use_cases && tool.use_cases.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-3">Use Cases</h2>
                <ul className="space-y-2">
                  {tool.use_cases.map((uc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      {uc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {screenshots.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-3">Screenshots</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {screenshots.map((url, i) => (
                    <div key={i} className="rounded-lg overflow-hidden bg-white/5">
                      <Image src={url} alt={`${tool.name} screenshot ${i + 1}`} width={600} height={400} className="object-cover w-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-t border-white/10 pt-4 first:border-0 first:pt-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating rating={review.rating} size="sm" />
                        {review.title && <span className="font-medium text-sm">{review.title}</span>}
                      </div>
                      {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {review.profiles?.display_name ?? 'Anonymous'} · {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {tool.tool_tags && tool.tool_tags.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tool.tool_tags.map(({ tags }) => (
                    <Badge key={tags.id} variant="secondary" className="text-xs">
                      {tags.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-3">Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Pricing</dt>
                  <dd><Badge variant="outline" className={`text-xs ${pricingColor}`}>{pricingLabel}</Badge></dd>
                </div>
                {tool.pricing_details && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Plan Details</dt>
                    <dd className="text-right text-xs max-w-32">{tool.pricing_details}</dd>
                  </div>
                )}
                {tool.categories && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd>
                      <Link href={`/categories/${tool.categories.slug}`} className="text-primary hover:underline text-xs">
                        {tool.categories.name}
                      </Link>
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Reviews</dt>
                  <dd className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {tool.avg_rating > 0 ? `${tool.avg_rating.toFixed(1)} (${tool.review_count})` : 'No reviews'}
                  </dd>
                </div>
                {tool.published_at && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Added</dt>
                    <dd className="text-xs">{new Date(tool.published_at).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </div>

            <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full gap-2">
                Visit {tool.name}
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
