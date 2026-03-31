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
import { getAllCategories } from '@/lib/supabase/queries/categories'

import { SocialProofBar } from '@/components/home/SocialProofBar'
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

  const [siteStats, mostTracked, overlaps, latestPosts, calcToolsResult, categories] = await Promise.all([
    getSiteStats(),
    getMostTrackedTools(8),
    getOverlapExamples(),
    getLatestPosts(3),
    calcToolsQuery,
    getAllCategories(),
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
      <main className="min-h-screen pt-20 flex flex-col gap-16 md:gap-24 pb-32">
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'AIPowerStacks - Track Your AI Spend',
          description: 'Track AI subscriptions, detect overlap, and stop overpaying.',
          url: SITE_URL,
        }} />

        {/* ═══ Hero + Calculator ═══ */}
        <section className="relative px-4 max-w-3xl mx-auto w-full pt-8 sm:pt-20">
          {/* Hero gradient background */}
          <div className="pointer-events-none absolute inset-0 -top-20 overflow-hidden" aria-hidden="true">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.04] blur-[100px] dark:bg-primary/[0.08]" />
            <div className="absolute top-20 left-1/4 w-[300px] h-[300px] rounded-full blur-[80px]" style={{ background: 'rgba(212, 64, 43, 0.10)' }} />
          </div>

          <div className="relative text-center mb-10 sm:mb-12 animate-fade-up">
            <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] font-semibold tracking-tight text-foreground mb-4 leading-[1.08] sm:leading-[1.1]">
              How much is AI{' '}<br className="hidden sm:block" />costing you?
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground/70 max-w-lg mx-auto leading-relaxed">
              Track your AI subscriptions. See what overlaps. Cut what you don&apos;t need.
            </p>
            <p className="mt-3 text-xs sm:text-sm text-muted-foreground/50 font-medium">
              {siteStats.toolCount}+ tools tracked · Updated daily · Free to use
            </p>
          </div>

          <CostCalculator tools={(calcToolsResult.data || []).map(t => ({ id: t.id, name: t.name, slug: t.slug, logo_url: t.logo_url, pricing_model: t.pricing_model }))} isLoggedIn={!!user} />
        </section>

        {/* ═══ Social Proof Bar ═══ */}
        <section className="px-4 max-w-3xl mx-auto w-full">
          <SocialProofBar toolCount={siteStats.toolCount} categoryCount={categories.length} />
        </section>

        {/* ═══ The hook — one punchy stat ═══ */}
        <section className="px-4 max-w-2xl mx-auto w-full text-center">
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            The average team spends <strong className="text-foreground">$120/mo</strong> on AI tools.
            Most are paying for <strong className="text-foreground">2-3 tools that do the same thing</strong>.
          </p>
        </section>

        {/* ═══ How it works — Bento Grid ═══ */}
        <section className="px-4 max-w-3xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 stagger-in">
            <div className="bento-card bg-gradient-to-br from-emerald-50/60 to-transparent dark:from-emerald-500/[0.06] dark:to-transparent">
              <div className="h-11 w-11 sm:h-10 sm:w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mb-3">
                <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-semibold text-sm sm:text-sm mb-1">Add your stack</p>
              <p className="text-sm sm:text-xs text-muted-foreground leading-relaxed">Tap the tools you pay for. Takes 10 seconds.</p>
            </div>
            <div className="bento-card bg-gradient-to-br from-blue-50/60 to-transparent dark:from-blue-500/[0.06] dark:to-transparent">
              <div className="h-11 w-11 sm:h-10 sm:w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center mb-3">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-semibold text-sm sm:text-sm mb-1">See the overlap</p>
              <p className="text-sm sm:text-xs text-muted-foreground leading-relaxed">We flag tools competing for the same job.</p>
            </div>
            <div className="bento-card bg-gradient-to-br from-amber-50/60 to-transparent dark:from-amber-500/[0.06] dark:to-transparent">
              <div className="h-11 w-11 sm:h-10 sm:w-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mb-3">
                <Scissors className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="font-semibold text-sm sm:text-sm mb-1">Cut the waste</p>
              <p className="text-sm sm:text-xs text-muted-foreground leading-relaxed">Compare overlaps side-by-side. You decide what stays.</p>
            </div>
            <div className="bento-card bg-gradient-to-br from-violet-50/60 to-transparent dark:from-violet-500/[0.06] dark:to-transparent">
              <div className="h-11 w-11 sm:h-10 sm:w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center mb-3">
                <ArrowRight className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="font-semibold text-sm sm:text-sm mb-1">Save every month</p>
              <p className="text-sm sm:text-xs text-muted-foreground leading-relaxed">Your personalized savings report shows exactly where to cut.</p>
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
                  className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-card p-4 sm:p-4 flex flex-col items-center gap-2.5 text-center hover:border-primary/25 hover:shadow-md transition-all duration-200 group"
                >
                  {tool.logo_url ? (
                    <img src={tool.logo_url} alt={tool.name} className="w-10 h-10 sm:w-10 sm:h-10 rounded-lg object-contain" />
                  ) : (
                    <span className="w-10 h-10 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{tool.name?.[0] || '?'}</span>
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
          <div className="relative overflow-hidden rounded-2xl border border-foreground/[0.06] p-6 sm:p-12 text-center">
            {/* Gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.02] dark:from-primary/[0.06] dark:to-primary/[0.03]" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
                Find out which tools to cancel.
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 sm:mb-8">
                Track your subscriptions. We&apos;ll flag overlap and show you
                exactly where to cut — you make the call.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link href={user ? '/tracker' : '/login?redirectTo=/tracker'} className="w-full sm:w-auto">
                  <Button size="lg" className="btn-glow font-bold gap-2 w-full sm:w-auto h-12 px-8 text-base">
                    Track My AI Spend
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/compare" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="font-bold border-foreground/15 w-full sm:w-auto h-12 px-8">
                    Compare Tools
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-6">
                Free to use · {siteStats.toolCount}+ tools · Real pricing data
              </p>
            </div>
          </div>
        </section>

        {/* ═══ Newsletter + Submit ═══ */}
        <section className="px-4 max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 border border-foreground/[0.06] rounded-2xl overflow-hidden">
            <div className="p-5 sm:p-8 flex flex-col gap-5">
              <div>
                <p className="text-xs font-medium text-primary mb-2">The AI Stack Report</p>
                <h2 className="text-lg font-bold mb-1">Weekly AI cost intelligence</h2>
                <p className="text-sm text-muted-foreground">Price changes, new tools, and where smart teams are cutting spend.</p>
              </div>
              <NewsletterBanner source="homepage-mid" tone="light" />
            </div>
            <div className="p-5 sm:p-8 flex flex-col justify-center gap-4 bg-foreground/[0.015] md:border-l border-t md:border-t-0 border-foreground/[0.06]">
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
              <div className="flex sm:grid sm:grid-cols-3 gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                {briefingItems.map((news) => (
                  <Link
                    key={news.id}
                    href={news.url}
                    className="group rounded-xl overflow-hidden border border-foreground/[0.06] hover:border-primary/20 transition-all min-w-[75vw] sm:min-w-0 snap-start"
                  >
                    {news.image_url ? (
                      <div className="relative h-32 sm:h-36 overflow-hidden">
                        <Image
                          src={news.image_url}
                          alt={news.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="h-32 sm:h-36 bg-muted/30" />
                    )}
                    <div className="p-3.5 sm:p-4 flex flex-col gap-1.5">
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
