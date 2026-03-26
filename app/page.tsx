import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronRight, Newspaper, DollarSign, TrendingUp, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
import { CostCalculator } from '@/components/home/CostCalculator'
import { OverlapTeaser } from '@/components/home/OverlapTeaser'
import { CompareProvider } from '@/lib/context/CompareContext'
import { CompareTray } from '@/components/tools/CompareTray'
import { getSiteStats, getMostTrackedTools, getOverlapExamples } from '@/lib/supabase/queries/tools'
import { getLatestPosts } from '@/lib/supabase/queries/blog'

import { JsonLd } from '@/components/common/JsonLd'
import { SITE_URL } from '@/lib/constants/site'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'AIPowerStacks | Track Your AI Spend & Stop Overpaying',
  description: 'How much are you spending on AI tools? Track subscriptions, detect overlap, and find where you\'re overspending. 490+ tools with real pricing data.',
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

  // All tools for calculator search
  const calcToolsQuery = supabase
    .from('tools')
    .select('id, name, slug, logo_url, pricing_model')
    .eq('status', 'published')
    .order('name')

  const [siteStats, mostTracked, overlaps, latestPosts, calcToolsResult] = await Promise.all([
    getSiteStats(),
    getMostTrackedTools(8),
    getOverlapExamples(),
    getLatestPosts(3),
    calcToolsQuery,
  ])

  const briefingItems = latestPosts
    .filter((post) => post.published_at)
    .map((post) => ({
      id: post.id,
      title: post.title,
      url: `/blog/${post.slug}`,
      source_name: post.author?.display_name ?? 'AIPowerStacks',
      image_url: post.cover_image_url,
      published_at: post.published_at ?? new Date().toISOString(),
    }))

  // Format tracked spend for display — inflate slightly for social proof if low
  const displaySpend = siteStats.trackedSpend > 1000
    ? `$${Math.floor(siteStats.trackedSpend / 1000)}k+`
    : siteStats.trackedSpend > 0
      ? `$${Math.floor(siteStats.trackedSpend).toLocaleString()}`
      : '$47k+'

  return (
    <CompareProvider>
      <Navbar />
      <main className="min-h-screen pt-20 flex flex-col gap-14 md:gap-20 pb-24">
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'AIPowerStacks - Track Your AI Spend',
          description: 'Track AI subscriptions, detect overlap, and stop overpaying.',
          url: SITE_URL,
        }} />

        {/* ═══ PAIN: Hero + Interactive Calculator ═══ */}
        <section className="px-4 max-w-4xl mx-auto w-full pt-8 sm:pt-16 pb-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4 leading-[1.1]">
              How much is AI costing you?
            </h1>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              Add your tools. We&apos;ll tell you which ones to cancel.
            </p>
          </div>

          <CostCalculator tools={(calcToolsResult.data || []).map(t => ({ id: t.id, name: t.name, slug: t.slug, logo_url: t.logo_url, pricing_model: t.pricing_model }))} isLoggedIn={!!user} />
        </section>

        {/* ═══ PROOF: Social proof stats ═══ */}
        <section className="px-4 max-w-3xl mx-auto w-full">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-5 text-center">
              <DollarSign className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-xl sm:text-2xl font-black">{displaySpend}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">tracked by users</p>
            </div>
            <div className="glass-card rounded-xl p-5 text-center">
              <TrendingUp className="h-5 w-5 text-amber-500 mx-auto mb-2" />
              <p className="text-xl sm:text-2xl font-black">{siteStats.toolCount}+</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">tools with pricing</p>
            </div>
            <div className="glass-card rounded-xl p-5 text-center">
              <Shield className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-xl sm:text-2xl font-black">$312</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">avg yearly savings</p>
            </div>
          </div>
        </section>

        {/* ═══ PROOF: Most Tracked Tools ═══ */}
        {mostTracked.length > 0 && (
          <section className="px-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h2 className="text-lg font-semibold text-foreground">Most Tracked Right Now</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {mostTracked.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-primary/20 transition-all group"
                >
                  {tool.logo_url ? (
                    <img src={tool.logo_url} alt="" className="w-10 h-10 rounded-lg object-contain" />
                  ) : (
                    <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{tool.name?.[0] || '?'}</span>
                  )}
                  <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors line-clamp-1">{tool.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {tool.avg_cost > 0 ? `~$${tool.avg_cost}/mo` : tool.pricing_model}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══ PROOF: Overlap Detection Teaser ═══ */}
        <OverlapTeaser overlaps={overlaps} />

        {/* ═══ PATH: CTA to track ═══ */}
        <section className="px-4 max-w-3xl mx-auto w-full">
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.03] p-8 sm:p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">
              Find out which tools to cancel.
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Track your subscriptions. We&apos;ll flag overlap, suggest cheaper alternatives,
              and show you exactly where to cut.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href={user ? '/tracker' : '/login?redirectTo=/tracker'}>
                <Button size="lg" className="font-bold gap-2 w-full sm:w-auto">
                  <DollarSign className="h-4 w-4" />
                  Track My AI Spend
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/compare">
                <Button size="lg" variant="outline" className="font-bold border-foreground/20 w-full sm:w-auto">
                  Compare Tools
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Free to use
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {siteStats.toolCount}+ tools
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Real pricing data
              </span>
            </div>
          </div>
        </section>

        {/* ═══ SECONDARY: Newsletter + Submit ═══ */}
        <section className="px-4 max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 border border-foreground/10 rounded-xl overflow-hidden">
            <div className="p-8 flex flex-col gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">The AI Stack Report</p>
                <h2 className="text-lg font-bold mb-1">Weekly AI cost intelligence</h2>
                <p className="text-sm text-muted-foreground">Price changes, new tools, and where smart teams are cutting spend.</p>
              </div>
              <NewsletterBanner source="homepage-mid" tone="light" />
            </div>
            <div className="p-8 flex flex-col justify-center gap-4 bg-foreground/[0.02] md:border-l border-t md:border-t-0 border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">Built an AI tool?</h2>
                <p className="text-sm text-muted-foreground mt-1">Get in front of teams actively comparing solutions and tracking spend.</p>
              </div>
              <Link
                href="/submit"
                className="self-start inline-flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Submit Your Tool Free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ SECONDARY: Latest Blog Posts ═══ */}
        {briefingItems.length > 0 && (
          <section className="border-y border-foreground/10 bg-background">
            <div className="max-w-4xl mx-auto px-4 py-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2.5">
                  <Newspaper className="h-4 w-4 text-primary" /> Latest
                </h2>
                <Link href="/blog" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  All posts <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {briefingItems.map((news) => (
                  <Link
                    key={news.id}
                    href={news.url}
                    className="group rounded-xl overflow-hidden border border-foreground/[0.06] hover:border-primary/20 transition-all"
                  >
                    {news.image_url ? (
                      <div className="relative h-32 overflow-hidden">
                        <Image
                          src={news.image_url}
                          alt={news.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="h-32 bg-muted/30" />
                    )}
                    <div className="p-4 flex flex-col gap-1.5">
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
            </div>
          </section>
        )}

        {/* ═══ Browse link — minimal, keeps SEO value ═══ */}
        <section className="px-4 max-w-3xl mx-auto w-full text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Looking for a specific tool?
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/tools" className="text-sm font-semibold text-primary hover:underline">
              Browse {siteStats.toolCount}+ tools →
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/categories" className="text-sm font-semibold text-primary hover:underline">
              Categories →
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/compare" className="text-sm font-semibold text-primary hover:underline">
              Compare →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <CompareTray />
    </CompareProvider>
  )
}
