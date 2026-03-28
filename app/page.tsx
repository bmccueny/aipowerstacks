import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronRight, Newspaper, Scissors, Layers, Eye } from 'lucide-react'
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

  return (
    <CompareProvider>
      <Navbar />
      <main className="min-h-screen pt-20 flex flex-col gap-24 md:gap-36 pb-32">
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'AIPowerStacks - Track Your AI Spend',
          description: 'Track AI subscriptions, detect overlap, and stop overpaying.',
          url: SITE_URL,
        }} />

        {/* ═══ Hero + Calculator ═══ */}
        <section className="px-4 max-w-3xl mx-auto w-full pt-16 sm:pt-28">
          <div className="text-center mb-12 animate-fade-up">
            <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] font-semibold tracking-tight text-foreground mb-5 leading-[1.1]">
              How much is AI<br className="hidden sm:block" /> costing you?
            </h1>
            <p className="text-xl text-muted-foreground/70 max-w-lg mx-auto leading-relaxed">
              Track your AI subscriptions. See what overlaps. Cut what you don&apos;t need.
            </p>
          </div>

          <CostCalculator tools={(calcToolsResult.data || []).map(t => ({ id: t.id, name: t.name, slug: t.slug, logo_url: t.logo_url, pricing_model: t.pricing_model }))} isLoggedIn={!!user} />
        </section>

        {/* ═══ The hook — one punchy stat ═══ */}
        <section className="px-4 max-w-2xl mx-auto w-full text-center">
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            The average team spends <strong className="text-foreground">$120/mo</strong> on AI tools.
            Most are paying for <strong className="text-foreground">2-3 tools that do the same thing</strong>.
          </p>
        </section>

        {/* ═══ How it works — 3 steps ═══ */}
        <section className="px-4 max-w-3xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 stagger-in">
            <div className="text-center">
              <div className="h-10 w-10 rounded-xl bg-foreground/[0.04] flex items-center justify-center mx-auto mb-3">
                <Layers className="h-5 w-5 text-foreground/60" />
              </div>
              <p className="font-medium text-sm mb-1">1. Add your stack</p>
              <p className="text-xs text-muted-foreground">Tap the tools you pay for. Takes 10 seconds.</p>
            </div>
            <div className="text-center">
              <div className="h-10 w-10 rounded-xl bg-foreground/[0.04] flex items-center justify-center mx-auto mb-3">
                <Eye className="h-5 w-5 text-foreground/60" />
              </div>
              <p className="font-medium text-sm mb-1">2. See the overlap</p>
              <p className="text-xs text-muted-foreground">We flag tools competing for the same job.</p>
            </div>
            <div className="text-center">
              <div className="h-10 w-10 rounded-xl bg-foreground/[0.04] flex items-center justify-center mx-auto mb-3">
                <Scissors className="h-5 w-5 text-foreground/60" />
              </div>
              <p className="font-medium text-sm mb-1">3. Cut the waste</p>
              <p className="text-xs text-muted-foreground">Compare overlaps side-by-side. You decide what stays.</p>
            </div>
          </div>
        </section>

        {/* ═══ Most Tracked ═══ */}
        {mostTracked.length > 0 && (
          <section className="px-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h2 className="text-sm font-medium text-muted-foreground">Most tracked right now</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-in">
              {mostTracked.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="rounded-xl border border-black/[0.06] bg-white dark:bg-card p-4 flex flex-col items-center gap-2.5 text-center hover:border-black/[0.12] transition-colors duration-150 group"
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

        {/* ═══ Overlap Teaser ═══ */}
        <OverlapTeaser overlaps={overlaps} />

        {/* ═══ CTA ═══ */}
        <section className="px-4 max-w-3xl mx-auto w-full">
          <div className="relative overflow-hidden rounded-2xl border border-foreground/[0.06] p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
              Find out which tools to cancel.
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
              Track your subscriptions. We&apos;ll flag overlap and show you
              exactly where to cut — you make the call.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href={user ? '/tracker' : '/login?redirectTo=/tracker'}>
                <Button size="lg" className="btn-glow font-bold gap-2 w-full sm:w-auto h-12 px-8 text-base">
                  Track My AI Spend
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/compare">
                <Button size="lg" variant="outline" className="font-bold border-foreground/15 w-full sm:w-auto h-12 px-8">
                  Compare Tools
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Free to use · {siteStats.toolCount}+ tools · Real pricing data
            </p>
          </div>
        </section>

        {/* ═══ Newsletter + Submit ═══ */}
        <section className="px-4 max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 border border-foreground/[0.06] rounded-2xl overflow-hidden">
            <div className="p-8 flex flex-col gap-5">
              <div>
                <p className="text-xs font-medium text-primary mb-2">The AI Stack Report</p>
                <h2 className="text-lg font-bold mb-1">Weekly AI cost intelligence</h2>
                <p className="text-sm text-muted-foreground">Price changes, new tools, and where smart teams are cutting spend.</p>
              </div>
              <NewsletterBanner source="homepage-mid" tone="light" />
            </div>
            <div className="p-8 flex flex-col justify-center gap-4 bg-foreground/[0.015] md:border-l border-t md:border-t-0 border-foreground/[0.06]">
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

        {/* ═══ Blog Posts ═══ */}
        {briefingItems.length > 0 && (
          <section className="border-y border-foreground/[0.06]">
            <div className="max-w-4xl mx-auto px-4 py-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Newspaper className="h-3.5 w-3.5 text-primary" /> Latest
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
                      <div className="relative h-36 overflow-hidden">
                        <Image
                          src={news.image_url}
                          alt={news.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="h-36 bg-muted/30" />
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

        {/* ═══ Browse ═══ */}
        <section className="px-4 max-w-3xl mx-auto w-full text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Looking for a specific tool?
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/tools" className="text-sm font-semibold text-primary hover:underline">
              Browse {siteStats.toolCount}+ tools →
            </Link>
            <span className="text-muted-foreground/30">·</span>
            <Link href="/categories" className="text-sm font-semibold text-primary hover:underline">
              Categories →
            </Link>
            <span className="text-muted-foreground/30">·</span>
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
