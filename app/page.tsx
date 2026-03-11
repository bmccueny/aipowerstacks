import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronRight, ExternalLink, Newspaper, Sparkles, Zap, ShieldCheck, TrendingUp, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
import { HeroSearch } from '@/components/home/HeroSearch'
import { ToolCard } from '@/components/tools/ToolCard'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { getAllCategories } from '@/lib/supabase/queries/categories'
import { getLatestAINews } from '@/lib/supabase/queries/news'
import { getLatestTools, getSuperTools, getSiteStats } from '@/lib/supabase/queries/tools'
import { getLatestBriefings } from '@/lib/supabase/queries/blog'
import { CompareTray } from '@/components/tools/CompareTray'
import { SITE_URL } from '@/lib/constants/site'
import { createClient } from '@/lib/supabase/server'

type CombinedNewsItem = {
  id: string
  title: string
  url: string
  summary: string | null
  source_name: string
  source_url: string | null
  image_url: string | null
  published_at: string
  kind: 'rss' | 'briefing'
}

const SITE_BASE_URL = SITE_URL

function toAbsoluteUrl(url: string) {
  if (url.startsWith('http')) return url
  return `${SITE_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
}

function buildPreviewImageUrl(articleUrl: string): string {
  return `https://image.thum.io/get/width/1200/noanimate/${encodeURIComponent(articleUrl)}`
}

function normalizeNewsImageUrl(imageUrl: string | null, articleUrl: string): string {
  if (!imageUrl) return buildPreviewImageUrl(articleUrl)
  if (imageUrl.startsWith('https://image.thum.io/get/') && imageUrl.includes('/noanimate/https://')) {
    return buildPreviewImageUrl(articleUrl)
  }
  return imageUrl
}

export const metadata = {
  title: 'AIPowerStacks | Discover & Compare AI Tools',
  description: 'Discover and compare AI tools side-by-side. Filter by use case, pricing, and integrations. Verified listings, real user reviews, and daily updates.',
  alternates: {
    canonical: '/',
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [categories, latestTools, superTools, latestNews, latestBriefings, siteStats, stacksResult] = await Promise.all([
    getAllCategories(),
    getLatestTools(6),
    getSuperTools(6),
    getLatestAINews(6),
    getLatestBriefings(6),
    getSiteStats(),
    user
      ? supabase.from('collections').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      : Promise.resolve({ count: 0 }),
  ])

  const hasStacks = (stacksResult.count ?? 0) > 0

  const featuredCategories = categories.filter((c) => c.sort_order > 0).slice(0, 12)

  const briefingItems: CombinedNewsItem[] = latestBriefings
    .filter((post) => post.published_at)
    .map((post) => ({
      id: `briefing-${post.id}`,
      title: post.title,
      url: `/blog/${post.slug}`,
      summary: post.excerpt,
      source_name: 'AI briefing',
      source_url: null,
      image_url: post.cover_image_url,
      published_at: post.published_at ?? new Date().toISOString(),
      kind: 'briefing',
    }))

  const rssItems: CombinedNewsItem[] = latestNews.map((item) => {
    const articleUrl = toAbsoluteUrl(item.url)
    return {
      ...item,
      url: articleUrl,
      image_url: normalizeNewsImageUrl(item.image_url, articleUrl),
      kind: 'rss',
    }
  })

  const combinedNews = [...briefingItems, ...rssItems]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())

  const toolCount = siteStats.toolCount
  const reviewCount = siteStats.reviewCount
  const categoryCount = categories.length

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col gap-16 md:gap-20 pb-24">

        {/* Hero Section */}
        <section className="px-4 max-w-4xl mx-auto w-full pt-20 pb-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
              {toolCount.toLocaleString()}+ Verified Tools
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-5 leading-[1.1]">
              The AI Tool Intelligence<br className="hidden md:block" /> Platform
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Compare, evaluate, and shortlist AI tools across {categoryCount}+ categories — with verified reviews and daily updates.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <HeroSearch toolCount={siteStats.toolCount} />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Link
              href="/tools"
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              Browse All Tools
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/tools?pricing=free"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
            >
              Free Tools Only
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-border border border-border rounded-xl max-w-sm mx-auto overflow-hidden">
            <div className="text-center py-4 px-2">
              <div className="text-xl font-bold text-foreground">{toolCount.toLocaleString()}+</div>
              <div className="text-xs text-muted-foreground mt-0.5">Tools</div>
            </div>
            <div className="text-center py-4 px-2">
              <div className="text-xl font-bold text-foreground">{reviewCount.toLocaleString()}+</div>
              <div className="text-xs text-muted-foreground mt-0.5">Reviews</div>
            </div>
            <div className="text-center py-4 px-2">
              <div className="text-xl font-bold text-foreground">{categoryCount}+</div>
              <div className="text-xs text-muted-foreground mt-0.5">Categories</div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        {featuredCategories.length > 0 && (
          <section className="px-4 max-w-[860px] mx-auto w-full">
            <div className="flex items-center justify-center mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2.5">
                <span className="text-primary font-bold">&#x27E9;</span> Popular Categories
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5 mb-4">
              {featuredCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="category-pill group"
                >
                  <CategoryIcon slug={cat.slug} emoji={cat.icon} size="sm" />
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
            <div className="flex justify-center items-center gap-3 flex-wrap">
              <Link href="/categories" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                View all categories →
              </Link>
              <span className="text-muted-foreground text-sm">·</span>
              <Link href="/tools" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Browse all tools →
              </Link>
            </div>
          </section>
        )}

        {/* Top Rated — highest authority content */}
        {superTools.length > 0 && (
          <section className="px-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-center mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2.5">
                <span className="text-primary font-bold">&#x27E9;</span> Highest-Rated AI Tools
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {superTools.map((tool, idx) => (
                <div key={tool.id} className="animate-in-stagger" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <ToolCard tool={tool} cardStyle="home" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* New Tools */}
        <section className="px-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2.5">
              <span className="text-primary font-bold">&#x27E9;</span> Newly Added AI Tools
            </h2>
          </div>
          {latestTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {latestTools.map((tool, idx) => (
                <div key={tool.id} className="animate-in-stagger" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <ToolCard tool={tool} cardStyle="home" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="gum-card rounded-md h-[250px] animate-pulse bg-muted/50" />
              ))}
            </div>
          )}
        </section>

        {/* Power Stacks CTA — community bridge, shown after directory content */}
        {!hasStacks && <section className="px-4 max-w-7xl mx-auto w-full">
          <div className="relative overflow-hidden rounded-md border border-primary/20 bg-primary/5 p-8 md:p-12">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden md:block">
              <Layers className="h-64 w-64 text-primary" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <Badge className="mb-4 bg-primary text-primary-foreground hover:bg-primary/90">Community</Badge>
              <h2 className="text-3xl md:text-4xl font-black mb-4">Build Your <span className="text-primary">AI Power Stack</span></h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Save, organize, and share your go-to AI tools in one place. Create custom &quot;Stacks&quot; for every workflow — whether you ship code, create content, or run a team.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href={user ? '/dashboard' : '/login?redirectTo=/dashboard'}>
                  <Button size="lg" className="font-bold gap-2">
                    Create My First Stack <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/tools">
                  <Button size="lg" variant="outline" className="font-bold border-foreground/20">
                    Browse Tools First
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>100% free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Public or Private Stacks</span>
                </div>
              </div>
            </div>
          </div>
        </section>}

        {/* Newsletter + Submit CTA */}
        <section className="px-4 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 border-[1px] border-foreground rounded-md overflow-hidden">
            <div className="gum-card p-8 sm:p-10 flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">The AI Stack Report</p>
                <h2 className="text-xl font-bold mb-1">5 high-signal AI tools, every Friday morning</h2>
                <p className="text-sm text-muted-foreground">Tested, vetted, and ranked so you skip the noise and ship faster.</p>
              </div>
              <NewsletterBanner source="homepage-mid" tone="light" />
            </div>
            <div className="p-8 sm:p-10 flex flex-col justify-center gap-4 bg-zinc-900 md:border-l border-t md:border-t-0 border-foreground">
              <div>
                <h2 className="text-xl font-bold text-white">Built an AI tool? Get discovered.</h2>
                <p className="text-sm text-white/60 mt-1">Put your tool in front of {toolCount >= 1000 ? `${Math.floor(toolCount / 1000)}k+` : 'thousands of'} founders, developers, and buyers actively comparing solutions.</p>
              </div>
              <Link
                href="/submit"
                className="self-start inline-flex items-center gap-2 h-11 px-6 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-2"
              >
                Submit Your Tool Free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* News */}
        <section className="border-y-[1px] border-foreground bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-center mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2.5">
                <span className="text-primary font-bold">&#x27E9;</span> AI Industry News & Analysis
              </h2>
            </div>

            {combinedNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {combinedNews.slice(0, 6).map((news) => (
                  <a
                    key={news.id}
                    href={news.url}
                    target={news.kind === 'rss' ? "_blank" : "_self"}
                    rel={news.kind === 'rss' ? "noopener noreferrer" : undefined}
                    className="override grid h-full overflow-hidden rounded-lg brutalist-card-effect no-underline group"
                  >
                    {news.image_url && (
                      <div className="relative h-44 w-full overflow-hidden border-b border-foreground/10">
                        <Image
                          src={news.image_url}
                          alt={news.title}
                          fill
                          className="object-cover transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 rounded-full bg-primary/10">
                          {news.source_name}
                        </span>
                        <span className="text-[14px] font-reddit font-semibold text-muted-foreground">
                          {new Date(news.published_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h3 className="font-bold text-[16px] leading-tight mb-4 pb-0.5 transition-colors line-clamp-3 flex-1 group-hover:text-primary transition-colors">
                        {news.title}
                      </h3>
                      <div className="mt-auto flex items-center text-xs font-bold text-foreground transition-colors gap-1 uppercase tracking-tighter">
                        Read Story <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="gum-card rounded-md p-8 text-center text-muted-foreground">No AI news yet.</div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <CompareTray />
    </>
  )
}
