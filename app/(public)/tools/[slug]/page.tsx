import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, ExternalLink, Star, Tag, TrendingDown, TrendingUp, Check, X, Zap, DollarSign } from 'lucide-react'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
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
import { RelatedLinks } from '@/components/common/RelatedLinks'
import { AdminReviewPanel } from '@/components/admin/AdminReviewPanel'
import { createClient } from '@/lib/supabase/server'
import { getToolBySlug, getRelatedToolsByCategory, getPopularToolsExcluding } from '@/lib/supabase/queries/tools'
import { getReviewsByTool } from '@/lib/supabase/queries/reviews'
import { generateFaqJsonLd, generateJsonLd, generateToolMetadata, generateBreadcrumbJsonLd, generateReviewsJsonLd } from '@/lib/utils/seo'
import { PRICING_BADGE_COLORS, PRICING_LABELS, MODEL_PROVIDER_LABELS } from '@/lib/constants'
import { RelatedPages } from '@/components/seo/RelatedPages'

export const revalidate = 3600 // ISR: revalidate every hour

export async function generateStaticParams() {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tools')
    .select('slug')
    .eq('status', 'published')
    .order('upvote_count', { ascending: false })
    .limit(500)
  return (data ?? []).map((t) => ({ slug: t.slug }))
}

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
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    // Corrupted auth cookie
  }
  const { data: profile } = user ? await supabase.from('profiles').select('role').eq('id', user.id).single() : { data: null }
  const isAdmin = profile?.role === 'admin'
  const tool = await getToolBySlug(slug)

  if (!tool) notFound()

  // Find blog posts that mention this tool (by link or name)
  const blogQuery = supabase
    .from('blog_posts')
    .select('title, slug, cover_image_url, published_at')
    .eq('status', 'published')
    .or(`content.ilike.%/tools/${tool.slug}%,content.ilike.%${tool.name}%`)
    .order('published_at', { ascending: false })
    .limit(3)

  const tiersQuery = supabase
    .from('tool_pricing_tiers')
    .select('tier_name, monthly_price, features')
    .eq('tool_id', tool.id)
    .order('sort_order', { ascending: true })

  const [reviews, alternatives, youMightLike, featuredInResult, tiersResult] = await Promise.all([
    getReviewsByTool(tool.id, user?.id),
    getRelatedToolsByCategory({
      categoryId: tool.category_id,
      excludeToolId: tool.id,
      limit: 3,
    }),
    getPopularToolsExcluding([tool.id], 4),
    blogQuery,
    tiersQuery,
  ])
  const pricingTiers = (tiersResult.data || []) as { tier_name: string; monthly_price: number; features: string | null }[]
  const featuredInPosts = featuredInResult.data ?? []

  const screenshots = Array.isArray(tool.screenshot_urls) ? tool.screenshot_urls as string[] : []
  const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
  const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'

  const pros = (tool.pros && tool.pros.length > 0) ? tool.pros : []

  const cons = (tool.cons && tool.cons.length > 0) ? tool.cons : []

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
        : daysSinceUpdate <= 90
          ? 'Older data'
          : 'May be outdated'
  const isStale = daysSinceUpdate !== null && daysSinceUpdate > 90
  const updatedDateText = updatedAt
    ? new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(updatedAt))
    : null

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    ...(tool.categories ? [{ name: tool.categories.name, url: `/categories/${tool.categories.slug}` }] : []),
    { name: tool.name, url: `/tools/${tool.slug}` },
  ]

  const { data: trend } = await supabase.rpc('get_tool_price_trend', { p_tool_id: tool.id })
  const priceChange = trend?.[0]?.percent_change ?? 0

  return (
    <>
      <JsonLd data={generateJsonLd(tool)} />
      <JsonLd data={generateFaqJsonLd(tool)} />
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />
      {(() => {
        const reviewsLd = generateReviewsJsonLd(tool, reviews)
        if (!reviewsLd || reviewsLd.length === 0) return null
        return reviewsLd.map((ld, i) => <JsonLd key={`review-${i}`} data={ld} />)
      })()}

      <div className="page-shell">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
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

        <div className="rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] p-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="h-24 w-24 shrink-0 rounded-xl border border-foreground/10 bg-background shadow-sm overflow-hidden flex items-center justify-center">
              {tool.logo_url ? (
                <Image src={tool.logo_url} alt={tool.name} width={96} height={96} className="object-cover" />
              ) : (
                <span className="text-4xl font-bold text-primary">{tool.name[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <h1 className="text-3xl font-black">{tool.name}</h1>
                {tool.verified_by_admin && (
                  <VerifiedBadge size="sm" showLabel label="Expert Verified" />
                )}
                {tool.is_verified && !tool.verified_by_admin && (
                  <VerifiedBadge size="sm" showLabel />
                )}
              </div>
              <p className="text-muted-foreground mb-3 leading-relaxed">{tool.tagline}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className={pricingColor}>{pricingLabel}</Badge>
                  {tool.pricing_tags?.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px] bg-stone-100 text-stone-600 border-stone-200">
                      {tag}
                    </Badge>
                  ))}
                  {(tool.pricing_tags?.length ?? 0) > 2 && (
                    <span className="text-[10px] font-bold text-muted-foreground self-center">+{(tool.pricing_tags?.length ?? 0) - 2}</span>
                  )}
                </div>
                {tool.categories && (
                  <Link href={`/categories/${tool.categories.slug}`}>
                    <Badge variant="outline" className="border-foreground/10 hover:border-foreground/20 transition-colors">
                      {tool.categories.icon} {tool.categories.name}
                    </Badge>
                  </Link>
                )}
                <Badge variant="outline" className={isStale ? 'border-amber-400/30 text-amber-600 dark:text-amber-400' : 'border-foreground/10 text-muted-foreground'}>{freshnessLabel}</Badge>
              </div>
              <div className="mb-4 text-xs text-muted-foreground">
                <p>
                  Updated means this listing was last refreshed on {updatedDateText ?? 'an unpublished date'}.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <a href={tool.website_url} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="gap-2 font-bold h-11 px-6">
                    Visit {tool.name}
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                {tool.admin_review_video_url && (
                  <a href={tool.admin_review_video_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5">
                      <Zap className="h-4 w-4 fill-primary" />
                      Watch Expert Review
                    </Button>
                  </a>
                )}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20 lg:pb-0">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-3">About {tool.name}</h2>
              <div className="flex flex-wrap gap-1.5 mb-4 items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">Pricing:</span>
                {tool.pricing_tags && tool.pricing_tags.length > 0 ? (
                  tool.pricing_tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20 uppercase font-bold">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold ${pricingColor}`}>
                    {pricingLabel}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed">{tool.description}</p>
            </div>

            {showProsConsSection && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pros.length > 0 && (
                  <div className="glass-card rounded-xl p-5">
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
                  <div className="glass-card rounded-xl p-5">
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
              <div className="glass-card rounded-xl p-6">
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
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3">Alternatives</h2>
                <div className="space-y-3">
                  {alternatives.map((alt) => (
                    <div key={alt.id} className="border border-foreground/10 rounded-xl p-3 flex items-center justify-between gap-4">
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

            {featuredInPosts.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3">Featured in Articles</h2>
                <div className="space-y-3">
                  {featuredInPosts.map((post) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`} className="flex items-center gap-3 group">
                      {post.cover_image_url && (
                        <img src={post.cover_image_url} alt={post.title} className="w-16 h-10 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">{post.title}</p>
                        {post.published_at && (
                          <p className="text-xs text-muted-foreground mt-0.5">{new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {youMightLike.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3">You Might Also Like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {youMightLike.map((rec) => (
                    <Link
                      key={rec.id}
                      href={`/tools/${rec.slug}`}
                      className="border border-foreground/[0.06] rounded-xl p-3 flex items-center gap-3 hover:border-primary/30 transition-all group"
                    >
                      <div className="h-9 w-9 shrink-0 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                        {rec.logo_url ? (
                          <Image src={rec.logo_url} alt={rec.name} width={36} height={36} className="object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-primary">{rec.name[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">{rec.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{rec.tagline}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <RelatedLinks
              toolSlug={tool.slug}
              toolName={tool.name}
              categorySlug={tool.categories?.slug ?? null}
              categoryName={tool.categories?.name ?? null}
              categoryId={tool.category_id}
            />

            {screenshots.length > 0 && (
              <div className="glass-card rounded-xl p-6">
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

            {isAdmin && (
              <AdminReviewPanel 
                toolId={tool.id} 
                initialVerified={tool.verified_by_admin ?? false}
                initialVideoUrl={tool.admin_review_video_url ?? null}
                initialNotes={tool.admin_review_notes ?? null}
              />
            )}

            <div id="reviews" className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">No published reviews yet. Be the first to submit one.</p>
              ) : (
                <div>
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} currentUserId={user?.id} />
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
            <div className="glass-card rounded-xl p-5 space-y-3 hidden lg:block">
              <h3 className="text-sm font-semibold">Try This Tool</h3>
              <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full h-11 gap-2">
                  Visit Website
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <Link href={`/tracker?add=${tool.slug}`} className="block">
                <Button variant="outline" className="w-full h-11 gap-2">
                  <DollarSign className="h-4 w-4" />
                  Track This
                </Button>
              </Link>
              <AddToCompareButton slug={tool.slug} name={tool.name} fullWidth />
              <BookmarkButton toolId={tool.id} />
            </div>

            {/* Pricing tiers */}
            {pricingTiers.length > 0 && (
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" /> Plans & Pricing
                </h3>
                <div className="space-y-2">
                  {pricingTiers.map((tier) => (
                    <div key={tier.tier_name} className="flex items-center justify-between py-2 border-b border-foreground/[0.06] last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{tier.tier_name}</p>
                        {tier.features && <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{tier.features}</p>}
                      </div>
                      <span className="text-sm font-black shrink-0">
                        {tier.monthly_price === 0 ? 'Free' : `$${tier.monthly_price}/mo`}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/tracker?add=${tool.slug}`}
                  className="block mt-3 text-center text-xs font-semibold text-primary hover:underline"
                >
                  Track this in your budget →
                </Link>
              </div>
            )}

            {tool.tool_tags && tool.tool_tags.length > 0 && (
              <div className="glass-card rounded-xl p-5">
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

            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Technical Specs</h3>
              <dl className="space-y-2 text-sm mb-6">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">API Access</dt>
                  <dd>{tool.has_api ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30" />}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Mobile App</dt>
                  <dd>{tool.has_mobile_app ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30" />}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Open Source</dt>
                  <dd>{tool.is_open_source ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30" />}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">API Wrapper</dt>
                  <dd>{tool.is_api_wrapper ? <Check className="h-3.5 w-3.5 text-amber-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30" />}</dd>
                </div>
                {tool.model_provider && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Model Provider</dt>
                    <dd>
                      <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800">
                        {MODEL_PROVIDER_LABELS[tool.model_provider] ?? tool.model_provider}
                      </Badge>
                    </dd>
                  </div>
                )}
                {tool.wrapper_details && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Model Details</dt>
                    <dd className="text-right text-xs max-w-36">{tool.wrapper_details}</dd>
                  </div>
                )}
                {tool.has_api && (
                  <>
                    <div className="flex justify-between gap-3 pt-2 border-t border-foreground/5">
                      <dt className="text-muted-foreground flex items-center gap-1.5">
                        API Latency
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live data" />
                      </dt>
                      <dd className="font-mono text-[11px] font-bold text-foreground">
                        {tool.api_latency ? `${tool.api_latency}ms` : 'Calculating...'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">API Uptime</dt>
                      <dd className="font-mono text-[11px] font-bold text-emerald-600">
                        {tool.api_uptime ? `${Number(tool.api_uptime).toFixed(1)}%` : '100.0%'}
                      </dd>
                    </div>
                  </>
                )}
              </dl>

              <h3 className="text-sm font-semibold mb-3">Listing Details</h3>
              <dl className="space-y-2 text-sm">
                {tool.time_to_value && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Time to Value</dt>
                    <dd className={`text-xs font-bold ${tool.time_to_value === 'instant' || tool.time_to_value === 'minutes' ? 'text-emerald-600 dark:text-emerald-400' : tool.time_to_value === 'hours' ? 'text-amber-600 dark:text-amber-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {tool.time_to_value === 'instant' ? '⚡ First win in seconds' : tool.time_to_value === 'minutes' ? '⚡ First win in minutes' : tool.time_to_value === 'hours' ? '🕐 Set up in hours' : tool.time_to_value === 'days' ? '📅 Takes days' : '📅 Weeks to full value'}
                    </dd>
                  </div>
                )}
                {tool.not_for && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Not For</dt>
                    <dd className="text-xs text-red-500/80 dark:text-red-400/70 text-right">{tool.not_for}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Pricing</dt>
                  <dd className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={`text-xs ${pricingColor}`}>{pricingLabel}</Badge>
                    {priceChange < 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 animate-in fade-in slide-in-from-right-1">
                        <TrendingDown className="h-2.5 w-2.5" />
                        Price dropped {Math.abs(priceChange).toFixed(0)}%
                      </span>
                    )}
                    {priceChange > 0 && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <TrendingUp className="h-2.5 w-2.5" />
                        Price rose {priceChange.toFixed(0)}%
                      </span>
                    )}
                  </dd>
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
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
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
                <Link href={`/tools/${tool.slug}/badge`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Get embed badge
                </Link>
              </div>
            </div>

            <NewsletterBanner source={categorySubscribeSource} />
          </div>
        </div>
      </div>

      {/* Related Pages — internal links for SEO */}
      <RelatedPages toolSlug={tool.slug} categorySlug={tool.categories?.slug ?? null} alternatives={alternatives} />

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] border-t border-foreground/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full h-11 gap-2">
              Visit
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
          <Link href={`/tracker?add=${tool.slug}`} className="flex-1">
            <Button variant="outline" className="w-full h-11 gap-1.5">
              <DollarSign className="h-4 w-4" />
              Track
            </Button>
          </Link>
          <Link href={compareHref} className="flex-1">
            <Button variant="outline" className="w-full h-11">Compare</Button>
          </Link>
        </div>
      </div>
    </>
  )
}
