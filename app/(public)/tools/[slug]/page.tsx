import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, ExternalLink, ShieldCheck, Star, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/common/JsonLd'
import { StarRating } from '@/components/reviews/StarRating'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { BookmarkButton } from '@/components/tools/BookmarkButton'
import { AddToStackButton } from '@/components/tools/AddToStackButton'
import { AddToCompareButton } from '@/components/tools/AddToCompareButton'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
import { createClient } from '@/lib/supabase/server'
import { getToolBySlug, getRelatedToolsByCategory } from '@/lib/supabase/queries/tools'
import { getReviewsByTool } from '@/lib/supabase/queries/reviews'
import { generateFaqJsonLd, generateJsonLd, generateToolMetadata, generateBreadcrumbJsonLd } from '@/lib/utils/seo'
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

function labelize(value: string | null | undefined) {
  if (!value) return null
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default async function ToolDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tool = await getToolBySlug(slug)

  if (!tool) notFound()

  const [reviews, alternatives] = await Promise.all([
    getReviewsByTool(tool.id),
    getRelatedToolsByCategory({
      categoryId: tool.category_id,
      excludeToolId: tool.id,
      limit: 3,
    }),
  ])

  const screenshots = Array.isArray(tool.screenshot_urls) ? tool.screenshot_urls as string[] : []
  const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
  const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'

  const pros = [
    tool.is_verified ? 'Verified listing with core tool details reviewed by the editorial team.' : null,
    tool.pricing_model === 'free' || tool.pricing_model === 'freemium' ? 'Accessible pricing model for early testing.' : null,
    tool.review_count > 0 && tool.avg_rating >= 4 ? `Strong user sentiment with a ${tool.avg_rating.toFixed(1)} average rating.` : null,
    tool.integrations && tool.integrations.length > 0 ? `Integration support includes ${tool.integrations.slice(0, 3).map((item) => labelize(item)).filter(Boolean).join(', ')}.` : null,
  ].filter(Boolean) as string[]

  const cons = [
    !tool.pricing_details ? 'Pricing details are limited and may require visiting the official website.' : null,
    tool.review_count < 3 ? 'Limited public review volume, so performance may vary by workflow.' : null,
    screenshots.length === 0 ? 'No screenshots provided for quick visual evaluation.' : null,
  ].filter(Boolean) as string[]

  const showProsConsSection = pros.length > 0 || cons.length > 0

  const bestFor = (tool.use_cases ?? []).slice(0, 4)

  const claimHref = `/submit?mode=claim&name=${encodeURIComponent(tool.name)}&website_url=${encodeURIComponent(tool.website_url)}`
  const suggestEditHref = `/submit?mode=suggest-edit&name=${encodeURIComponent(tool.name)}&website_url=${encodeURIComponent(tool.website_url)}`
  const categorySubscribeSource = tool.categories?.slug ? `category:${tool.categories.slug}` : 'tool-page'
  const compareHref = `/compare?tools=${encodeURIComponent(tool.slug)}`
  const updatedAt = tool.updated_at ?? tool.published_at
  const daysSinceUpdate = updatedAt
    ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const freshnessLabel = daysSinceUpdate === null
    ? 'Freshness pending'
    : daysSinceUpdate <= 7
      ? 'Recently updated'
      : daysSinceUpdate <= 30
        ? 'Updated this month'
        : 'Older data'

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    ...(tool.categories ? [{ name: tool.categories.name, url: `/categories/${tool.categories.slug}` }] : []),
    { name: tool.name, url: `/tools/${tool.slug}` },
  ]

  return (
    <>
      <JsonLd data={generateJsonLd(tool)} />
      <JsonLd data={generateFaqJsonLd(tool)} />
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />

      <div className="max-w-6xl mx-auto px-4 py-10 pb-28 lg:pb-10">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/tools" className="hover:text-foreground transition-colors">Tools</Link>
          {tool.categories && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={`/categories/${tool.categories.slug}`} className="hover:text-foreground transition-colors">{tool.categories.name}</Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{tool.name}</span>
        </nav>

        <div className="glass-card rounded-[10px] p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-muted overflow-hidden flex items-center justify-center">
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
                  <div className="flex items-center gap-1 text-emerald-700 text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground mb-3 leading-relaxed">{tool.tagline}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className={pricingColor}>{pricingLabel}</Badge>
                {tool.is_supertools && (
                  <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300">SuperTool</Badge>
                )}
                {tool.categories && (
                  <Link href={`/categories/${tool.categories.slug}`}>
                    <Badge variant="outline" className="border-foreground/30 hover:border-primary/50 transition-colors">
                      {tool.categories.icon} {tool.categories.name}
                    </Badge>
                  </Link>
                )}
                <Badge variant="outline" className="border-foreground/30 bg-background/80">{freshnessLabel}</Badge>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <a href={tool.website_url} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2">
                    Visit {tool.name}
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                {tool.avg_rating > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={tool.avg_rating} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {tool.avg_rating.toFixed(1)} from {tool.review_count} review{tool.review_count === 1 ? '' : 's'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-[10px] p-6">
              <h2 className="text-lg font-semibold mb-3">About {tool.name}</h2>
              <p className="text-muted-foreground leading-relaxed">{tool.description}</p>
            </div>

            {showProsConsSection && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pros.length > 0 && (
                  <div className="glass-card rounded-[10px] p-5">
                    <h2 className="text-base font-semibold mb-3">Pros</h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {pros.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-emerald-700 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {cons.length > 0 && (
                  <div className="glass-card rounded-[10px] p-5">
                    <h2 className="text-base font-semibold mb-3">Cons</h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {cons.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-amber-700 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {bestFor.length > 0 && (
              <div className="glass-card rounded-[10px] p-6">
                <h2 className="text-lg font-semibold mb-3">Best For</h2>
                <ul className="space-y-2">
                  {bestFor.map((uc) => (
                    <li key={uc} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      {uc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {alternatives.length > 0 && (
              <div className="glass-card rounded-[10px] p-6">
                <h2 className="text-lg font-semibold mb-3">Alternatives</h2>
                <div className="space-y-3">
                  {alternatives.map((alt) => (
                    <div key={alt.id} className="border border-foreground/20 rounded-xl p-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                          {alt.logo_url ? (
                            <Image src={alt.logo_url} alt={alt.name} width={36} height={36} className="object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-primary">{alt.name[0]}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/tools/${alt.slug}`} className="font-medium hover:text-primary transition-colors">
                            {alt.name}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">{alt.tagline}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/compare?tools=${encodeURIComponent([tool.slug, alt.slug].join(','))}`}>
                          <Button variant="outline" size="sm" className="border-foreground/25">Compare</Button>
                        </Link>
                        <Link href={`/tools/${alt.slug}`}>
                          <Button variant="ghost" size="sm">Open</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {screenshots.length > 0 && (
              <div className="glass-card rounded-[10px] p-6">
                <h2 className="text-lg font-semibold mb-3">Screenshots</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {screenshots.map((url, i) => (
                    <div key={i} className="rounded-lg overflow-hidden bg-background">
                      <Image src={url} alt={`${tool.name} screenshot ${i + 1}`} width={600} height={400} className="object-cover w-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div id="reviews" className="glass-card rounded-[10px] p-6">
              <h2 className="text-lg font-semibold mb-4">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">No published reviews yet. Be the first to submit one.</p>
              ) : (
                <div className="space-y-1">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
              <div className="mt-5 border-t border-foreground/15 pt-5">
                {user ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">Share your experience with this tool.</p>
                    <ReviewForm toolId={tool.id} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <Link href={`/login?redirectTo=/tools/${tool.slug}`} className="text-primary hover:underline">Sign in</Link> to write a review.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 self-start">
            <div className="glass-card rounded-[10px] p-5 space-y-3">
              <h3 className="text-sm font-semibold">Try This Tool</h3>
              <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full gap-2">
                  Visit Website
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <p className="text-xs text-muted-foreground">Save to your personal AI stack or shortlist for comparison.</p>
              <AddToStackButton toolId={tool.id} toolName={tool.name} />
              <AddToCompareButton slug={tool.slug} fullWidth />
              <BookmarkButton toolId={tool.id} />
            </div>

            {tool.tool_tags && tool.tool_tags.length > 0 && (
              <div className="glass-card rounded-[10px] p-5">
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

            <div className="glass-card rounded-[10px] p-5">
              <h3 className="text-sm font-semibold mb-3">Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Pricing</dt>
                  <dd><Badge variant="outline" className={`text-xs ${pricingColor}`}>{pricingLabel}</Badge></dd>
                </div>
                {tool.pricing_details && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Plan Details</dt>
                    <dd className="text-right text-xs max-w-36">{tool.pricing_details}</dd>
                  </div>
                )}
                {tool.categories && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd>
                      <Link href={`/categories/${tool.categories.slug}`} className="text-primary hover:underline text-xs">
                        {tool.categories.name}
                      </Link>
                    </dd>
                  </div>
                )}
                {tool.use_case && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Use Case</dt>
                    <dd className="text-right text-xs">{labelize(tool.use_case)}</dd>
                  </div>
                )}
                {tool.team_size && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Team Size</dt>
                    <dd className="text-right text-xs">{labelize(tool.team_size)}</dd>
                  </div>
                )}
                {tool.integrations && tool.integrations.length > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Integrations</dt>
                    <dd className="text-right text-xs max-w-40">{tool.integrations.map((item) => labelize(item)).filter(Boolean).join(', ')}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Reviews</dt>
                  <dd className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-600 text-amber-600" />
                    {tool.avg_rating > 0 ? `${tool.avg_rating.toFixed(1)} (${tool.review_count})` : 'No reviews'}
                  </dd>
                </div>
                {tool.published_at && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Added</dt>
                    <dd className="text-xs">{new Date(tool.published_at).toLocaleDateString()}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Last updated</dt>
                  <dd className="text-xs">{updatedAt ? new Date(updatedAt).toLocaleDateString() : 'Not specified'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Listing</dt>
                  <dd className="text-xs">{tool.is_verified ? 'Editor-verified' : 'Community-submitted'}</dd>
                </div>
              </dl>
              <div className="mt-4 pt-4 border-t border-foreground/10 flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Own this tool? Keep details accurate.</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={claimHref}>
                    <Button variant="outline" size="sm" className="w-full border-foreground/25 text-xs">Claim listing</Button>
                  </Link>
                  <Link href={suggestEditHref}>
                    <Button variant="outline" size="sm" className="w-full border-foreground/25 text-xs">Suggest edit</Button>
                  </Link>
                </div>
              </div>
            </div>

            <NewsletterBanner source={categorySubscribeSource} />
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-foreground/15 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full gap-2">
              Visit Website
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
          <Link href={compareHref} className="flex-1">
            <Button variant="outline" className="w-full">Compare</Button>
          </Link>
        </div>
      </div>
    </>
  )
}
