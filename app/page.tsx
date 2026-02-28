import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronRight, ExternalLink, Newspaper, Sparkles, Zap, Shield, TrendingUp, Layers } from 'lucide-react'
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
import { SITE_URL } from '@/lib/constants/site'

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
  title: 'AIPowerStacks — Discover the Best AI Tools',
  description: 'Find and compare 5,000+ AI tools by use case, pricing, team size, and integrations.',
  alternates: {
    canonical: '/',
  },
}

export default async function HomePage() {
  const [categories, latestTools, superTools, latestNews, latestBriefings, siteStats] = await Promise.all([
    getAllCategories(),
    getLatestTools(8),
    getSuperTools(6),
    getLatestAINews(6),
    getLatestBriefings(6),
    getSiteStats(),
  ])

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
        <section className="relative px-4 pt-20 pb-10 text-center max-w-5xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{toolCount.toLocaleString()}+ Tools. Updated Daily.</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Build Your{' '}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              10x Workflow
            </span>
            <br />in 60 Seconds
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-6">
            Stop wasting hours on tools that don&apos;t ship. We filter the noise so you can find the exact AI stack you need to build faster, smarter, and more efficiently.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto mb-10">
            {[
              { icon: Zap, label: 'Updated Daily' },
              { icon: Shield, label: 'Verified Tools' },
              { icon: TrendingUp, label: 'Community Rated' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className="p-2 rounded-lg glass">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <HeroSearch toolCount={toolCount} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <Link href="/tools">
              <Button size="sm" variant="outline" className="gap-2 !rounded-[4px]">
                Browse All Tools <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/tools?pricing=free">
              <Button size="sm" variant="ghost" className="!rounded-[4px] text-muted-foreground hover:text-foreground">
                Free tools only
              </Button>
            </Link>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{toolCount.toLocaleString()}+</strong> tools</span>
            <span className="text-foreground/20">|</span>
            <span><strong className="text-foreground">{reviewCount.toLocaleString()}+</strong> reviews</span>
            <span className="text-foreground/20">|</span>
            <span><strong className="text-foreground">{categoryCount}+</strong> categories</span>
          </div>
        </section>

        {/* Categories */}
        {featuredCategories.length > 0 && (
          <section className="px-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Browse by Category</h2>
              <Link href="/categories" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {featuredCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="glass-card category-card rounded-[4px] p-4 flex flex-col items-center justify-center gap-2 group min-h-[116px]"
                >
                  <CategoryIcon slug={cat.slug} emoji={cat.icon} />
                  <span className="text-[13px] leading-[1.35] font-medium text-center group-hover:text-primary transition-colors">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Power Stacks Marketing */}
        <section className="px-4 max-w-7xl mx-auto w-full">
          <div className="relative overflow-hidden rounded-[4px] border border-primary/20 bg-primary/5 p-8 md:p-12">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden md:block">
              <Layers className="h-64 w-64 text-primary" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <Badge className="mb-4 bg-primary text-primary-foreground hover:bg-primary/90">New Feature</Badge>
              <h2 className="text-3xl md:text-4xl font-black mb-4">Create Your <span className="text-primary">AI Power Stack</span></h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Organize your workflow like a pro. Save, categorize, and share your favorite AI tools in custom &quot;Stacks.&quot; Perfect for teams, content creators, and developers.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/login">
                  <Button size="lg" className="font-bold gap-2">
                    Build My First Stack <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/tools">
                  <Button size="lg" variant="outline" className="font-bold border-foreground/20">
                    Explore Tools First
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Free for all users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Public & Private Stacks</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top Rated */}
        {superTools.length > 0 && (
          <section className="px-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Well-Favored Tools</h2>
                <p className="text-sm text-muted-foreground mt-1">Top rated and vetted by the community</p>
              </div>
              <Link href="/tools?sort=rating" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Fresh Drops</h2>
              <p className="text-sm text-muted-foreground mt-1">Just added — worth testing now</p>
            </div>
            <Link href="/tools?sort=newest" className="text-sm text-primary hover:underline flex items-center gap-1">
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
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="gum-card rounded-[4px] h-[250px] animate-pulse bg-muted/50" />
              ))}
            </div>
          )}
        </section>

        {/* Newsletter Capture */}
        <section className="px-4 max-w-7xl mx-auto w-full">
          <div className="gum-card rounded-[4px] p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8 border-[1px] border-foreground">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">The Weekly Edge</p>
              <h2 className="text-xl font-bold mb-1">5 Tools that actually work, delivered every Friday</h2>
              <p className="text-sm text-muted-foreground">No fluff. Just the curated stack you need to stay ahead of the curve.</p>
            </div>
            <div className="w-full sm:w-80 shrink-0">
              <NewsletterBanner source="homepage-mid" tone="light" />
            </div>
          </div>
        </section>

        {/* Submit Tool CTA */}
        <section className="px-4 max-w-7xl mx-auto w-full">
          <div className="rounded-[4px] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-foreground text-background">
            <div>
              <h2 className="text-xl font-bold">Launching an AI tool?</h2>
              <p className="text-sm opacity-70 mt-1">Get in front of {toolCount >= 1000 ? `${Math.floor(toolCount / 1000)}k+` : 'thousands of'} power users. List your tool for free today.</p>
            </div>
            <Link href="/submit" className="shrink-0">
              <Button variant="outline" className="!rounded-[4px] border-background/30 bg-background text-foreground hover:bg-primary hover:text-foreground hover:border-primary card-hover">
                Get Listed Now <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </section>

        {/* News */}
        <section className="border-y-[1px] border-foreground bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                <h2 className="text-2xl sm:text-3xl font-black">AI News & Briefings</h2>
              </div>
              <Link href="/blog" className="text-sm text-primary hover:underline flex items-center gap-1">
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
                    className="glass-card card-hover rounded-[4px] overflow-hidden flex flex-col hover:border-primary transition-all group"
                  >
                    {news.image_url && (
                      <div className="relative h-40 w-full overflow-hidden border-b border-foreground/10">
                        <Image 
                          src={news.image_url} 
                          alt={news.title} 
                          fill 
                          className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 rounded-full bg-primary/10">
                          {news.source_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(news.published_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-[15px] leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {news.title}
                      </h3>
                      {news.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4 flex-1">
                          {news.summary}
                        </p>
                      )}
                      <div className="mt-auto flex items-center text-xs font-bold text-foreground group-hover:text-primary transition-colors gap-1 uppercase tracking-tighter">
                        Read Story <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="gum-card rounded-[4px] p-8 text-center text-muted-foreground">No AI news yet.</div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
