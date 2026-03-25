import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronRight, Newspaper, Sparkles, ShieldCheck, TrendingUp, Layers, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
import { HeroSearch } from '@/components/home/HeroSearch'
import { DiscoverFeed } from '@/components/home/DiscoverFeed'
import { ToolCard } from '@/components/tools/ToolCard'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { CompareProvider } from '@/lib/context/CompareContext'
import { CompareTray } from '@/components/tools/CompareTray'
import { getAllCategories } from '@/lib/supabase/queries/categories'
// News wire removed — keeping blog posts only
import { getLatestTools, getSuperTools, getSiteStats, getFeaturedStack } from '@/lib/supabase/queries/tools'
import { getLatestPosts } from '@/lib/supabase/queries/blog'

import { JsonLd } from '@/components/common/JsonLd'
import { SITE_URL } from '@/lib/constants/site'
import { createClient } from '@/lib/supabase/server'

type BlogNewsItem = {
  id: string
  title: string
  url: string
  source_name: string
  image_url: string | null
  published_at: string
}

export const metadata = {
  title: 'AIPowerStacks | Discover, Compare & Track AI Tools',
  description: 'Track your AI subscriptions, compare tools side-by-side, and find the right stack for your workflow. 480+ tools, real reviews, cost tracking.',
  alternates: {
    canonical: '/',
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    // Corrupted auth cookie
  }

  const [categories, latestTools, superTools, latestPosts, siteStats, stacksResult, featuredStack] = await Promise.all([
    getAllCategories(),
    getLatestTools(6),
    getSuperTools(6),
    getLatestPosts(6),
    getSiteStats(),
    user
      ? supabase.from('collections').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      : Promise.resolve({ count: 0 }),
    getFeaturedStack(),
  ])

  const hasStacks = (stacksResult.count ?? 0) > 0

  const featuredCategories = categories.filter((c) => c.sort_order > 0).slice(0, 12)

  const briefingItems: BlogNewsItem[] = latestPosts
    .filter((post) => post.published_at)
    .map((post) => ({
      id: post.id,
      title: post.title,
      url: `/blog/${post.slug}`,
      source_name: post.author?.display_name ?? 'AIPowerStacks',
      image_url: post.cover_image_url,
      published_at: post.published_at ?? new Date().toISOString(),
    }))

  const toolCount = siteStats.toolCount
  const reviewCount = siteStats.reviewCount
  const categoryCount = categories.length

  return (
    <CompareProvider>
      <Navbar />
      <main className="min-h-screen pt-20 flex flex-col gap-16 md:gap-20 pb-24">
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'AIPowerStacks - Discover & Compare AI Tools',
          description: 'Discover and compare AI tools side-by-side. Filter by use case, pricing, and integrations.',
          url: SITE_URL,
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: superTools.length + latestTools.length,
            itemListElement: [...superTools, ...latestTools].map((tool, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: tool.name,
              url: `${SITE_URL}/tools/${tool.slug}`,
            })),
          },
        }} />

        {/* Hero Section */}
        <section className="px-4 max-w-4xl mx-auto w-full pt-20 pb-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
              {toolCount.toLocaleString()}+ Tools Tracked
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-5 leading-[1.1]">
              How much are you<br className="hidden md:block" /> spending on AI?
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Track your AI subscriptions, compare tools side-by-side, and build the perfect stack. Stop paying for tools that overlap.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <HeroSearch toolCount={siteStats.toolCount} />
          </div>

          {/* Quick Actions — lead with tracker */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Link
              href="/tracker"
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <DollarSign className="h-3.5 w-3.5" />
              Track My AI Spend
            </Link>
            <Link
              href="/tools"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              Browse Tools
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/compare"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
            >
              Compare Side-by-Side
            </Link>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-foreground">{toolCount.toLocaleString()}+</div>
              <div className="text-xs text-muted-foreground mt-0.5">Tools</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-foreground">{reviewCount.toLocaleString()}+</div>
              <div className="text-xs text-muted-foreground mt-0.5">Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-foreground">{categoryCount}+</div>
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

        <DiscoverFeed />

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
                  <ToolCard tool={tool} />
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
                  <ToolCard tool={tool} />
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

        {/* Stack of the Day */}
        {featuredStack && (
          <section className="px-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-center mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2.5">
                <span className="text-primary font-bold">&#x27E9;</span> Stack of the Day
              </h2>
            </div>
            <Link href={`/stacks/${featuredStack.share_slug}`} className="block">
              <div className="glass-card rounded-xl p-6 sm:p-8 hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{featuredStack.icon || '⚡'}</span>
                  <div>
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{featuredStack.name}</h3>
                    {featuredStack.creator && (
                      <p className="text-xs text-muted-foreground">
                        by {featuredStack.creator.display_name || featuredStack.creator.username}
                      </p>
                    )}
                  </div>
                </div>
                {featuredStack.description && (
                  <p className="text-sm text-muted-foreground mb-5 line-clamp-2">{featuredStack.description}</p>
                )}
                <div className="flex items-center gap-3 overflow-hidden">
                  {featuredStack.tools.map((tool) => (
                    <div key={tool.id} className="flex items-center gap-2 shrink-0 bg-muted/50 rounded-lg px-3 py-2">
                      <div className="h-7 w-7 rounded-md bg-background overflow-hidden flex items-center justify-center">
                        {tool.logo_url ? (
                          <Image src={tool.logo_url} alt={tool.name} width={28} height={28} className="object-contain" />
                        ) : (
                          <span className="text-xs font-bold text-primary">{tool.name[0]}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{tool.name}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{featuredStack.view_count ?? 0} views</span>
                  <span>{featuredStack.save_count ?? 0} saves</span>
                  <span className="ml-auto text-primary font-semibold group-hover:underline">View Stack →</span>
                </div>
              </div>
            </Link>
          </section>
        )}

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
                <h2 className="text-xl font-bold mb-1">The AI briefing your feed algorithm won't show you</h2>
                <p className="text-sm text-muted-foreground">Weekly updates on cutting-edge models, breakthrough tools, and what matters for builders and buyers.</p>
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

        {/* Latest Blog Posts */}
        <section className="border-y-[1px] border-foreground bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2.5">
                <Newspaper className="h-4 w-4 text-primary" /> Latest Briefings
              </h2>
              <Link href="/blog" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                All posts <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {briefingItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {briefingItems.map((news) => (
                  <Link
                    key={news.id}
                    href={news.url}
                    className="override grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] h-full overflow-hidden rounded-lg brutalist-card-effect burn-glow-card no-underline group"
                  >
                    {news.image_url ? (
                      <div className="relative h-full min-h-[88px] overflow-hidden border-r border-foreground/10">
                        <Image
                          src={news.image_url}
                          alt={news.title}
                          fill
                          className="object-cover transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-full min-h-[88px] bg-muted/30 border-r border-foreground/10" />
                    )}
                    <div className="p-3 sm:p-4 flex flex-col justify-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        {news.source_name}
                      </span>
                      <h4 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {news.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(news.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 p-6 text-center text-sm text-muted-foreground">No briefings yet.</div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <CompareTray />
    </CompareProvider>
  )
}
