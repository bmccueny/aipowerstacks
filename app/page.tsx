import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronRight, ExternalLink, Newspaper, Sparkles, Zap, Shield, TrendingUp, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
import { HeroSearch } from '@/components/home/HeroSearch'
import { AiMatchmaker } from '@/components/home/AiMatchmaker'
import { ToolCard } from '@/components/tools/ToolCard'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { getAllCategories } from '@/lib/supabase/queries/categories'
import { getLatestAINews } from '@/lib/supabase/queries/news'
import { getLatestTools, getSuperTools, getSiteStats } from '@/lib/supabase/queries/tools'
import { getLatestBriefings } from '@/lib/supabase/queries/blog'
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
  title: 'AIPowerStacks | Compare 5,000+ AI Tools by Use Case',
  description: 'Compare 5,000+ AI tools side-by-side. Filter by use case, pricing, and integrations. Verified listings, real user reviews, and daily updates.',
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

        {/* Hero */}
        <section className="relative px-4 pt-20 pb-10 text-center max-w-5xl mx-auto w-full hero-float-group">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{toolCount.toLocaleString()}+ Verified AI Tools. Updated Daily.</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Compare{' '}
            <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">
              AI Tools
            </span>
            <br />Pick the Right One in Minutes
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-6">
            Filter by use case, pricing, integrations, and team size. Shortlist faster with side-by-side comparisons, real user reviews, and verified listings.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-10">
            {[
              {
                icon: Zap,
                label: 'Updated Daily',
                microcopy: 'New tools added and listings refreshed every 24 hours.',
              },
              {
                icon: Shield,
                label: 'Editorially Verified',
                microcopy: 'Pricing, features, and links checked by our team before publishing.',
              },
              {
                icon: TrendingUp,
                label: 'Community Rated',
                microcopy: 'Rankings powered by real user reviews, not paid placement.',
              },
            ].map(({ icon: Icon, label, microcopy }, idx) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center group">
                <div 
                  className="p-3.5 rounded-xl glass shadow-[0_12px_24px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.5)] animate-delicate-float"
                  style={{ animationDelay: `${idx * 1.2}s` }}
                >
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-bold tracking-tight text-foreground/80 mt-1">{label}</span>
                <span className="text-[10px] leading-relaxed text-muted-foreground/60 max-w-[10rem] group-hover:text-muted-foreground transition-colors">{microcopy}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <HeroSearch toolCount={toolCount} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Try &quot;best AI writing tool&quot; or &quot;free image generators&quot; to get started.
          </p>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{toolCount.toLocaleString()}+</strong> tools</span>
            <span className="text-foreground/20">|</span>
            <span><strong className="text-foreground">{reviewCount.toLocaleString()}+</strong> reviews</span>
            <span className="text-foreground/20">|</span>
            <span><strong className="text-foreground">{categoryCount}+</strong> categories</span>
          </div>
        </section>

        {/* AI Matchmaker Agent */}
        <section className="px-4 max-w-4xl mx-auto w-full -mt-8 relative z-20">
          <AiMatchmaker />
        </section>

        {/* Categories */}
        {featuredCategories.length > 0 && (
          <section className="px-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Browse AI Tools by Category</h2>
              <Link href="/categories" className="text-sm font-bold text-foreground hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {featuredCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="category-card rounded-md p-3 flex flex-col items-center justify-center gap-2 group min-h-[100px]"
                >
                  <CategoryIcon slug={cat.slug} emoji={cat.icon} />
                  <span className="text-[13px] leading-[1.35] font-medium text-center transition-colors">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Power Stacks Marketing — hidden once user has built a stack */}
        {!hasStacks && <section className="px-4 max-w-7xl mx-auto w-full">
          <div className="relative overflow-hidden rounded-md border border-primary/20 bg-primary/5 p-8 md:p-12">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden md:block">
              <Layers className="h-64 w-64 text-primary" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <Badge className="mb-4 bg-primary text-primary-foreground hover:bg-primary/90">New Feature</Badge>
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

        {/* Top Rated */}
        {superTools.length > 0 && (
          <section className="px-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Highest-Rated AI Tools</h2>
                <p className="text-sm text-muted-foreground mt-1">Top-scored by the community and verified by our editors</p>
              </div>
              <Link href="/tools?sort=rating" className="text-sm font-bold text-foreground hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>            </div>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Newly Added AI Tools</h2>
              <p className="text-sm text-muted-foreground mt-1">Just listed this week — be the first to review them</p>
            </div>
            <Link href="/tools?sort=newest" className="text-sm font-bold text-foreground hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
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
            <div className="p-8 sm:p-10 flex flex-col justify-center gap-4 bg-foreground text-background md:border-l border-t md:border-t-0 border-foreground">
              <div>
                <h2 className="text-xl font-bold">Built an AI tool? Get discovered.</h2>
                <p className="text-sm opacity-70 mt-1">Put your tool in front of {toolCount >= 1000 ? `${Math.floor(toolCount / 1000)}k+` : 'thousands of'} founders, developers, and buyers actively comparing solutions.</p>
              </div>
              <div className="relative group self-start w-full lg:w-auto mt-2">
                <div className="absolute inset-0 rounded-sm bg-[#FFD100] border border-black transition-transform duration-150 z-[1]"></div>
                <div className="absolute inset-0 rounded-sm bg-[#FF4F00] border border-black transition-transform duration-150 group-hover:translate-x-2 group-hover:translate-y-2 z-[0]"></div>
                <Link 
                  href="/submit" 
                  className="relative inline-flex rounded-sm no-underline items-center justify-center border border-black transition-all duration-150 group-hover:-translate-x-2 group-hover:-translate-y-2 z-[2] w-full lg:w-auto cursor-pointer h-14 px-8 text-xl lg:h-16 lg:px-10 lg:text-xl bg-black text-white shadow-none"
                >
                  Submit Your Tool Free <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* News */}
        <section className="border-y-[1px] border-foreground bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                <h2 className="text-2xl sm:text-3xl font-black">AI Industry News & Analysis</h2>
              </div>
            <Link href="/blog" className="text-sm font-bold text-foreground hover:underline flex items-center gap-1">
              Read all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
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
    </>
  )
}
