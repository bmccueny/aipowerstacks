import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronRight, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
import { CostCalculator } from '@/components/home/CostCalculator'
import { OverlapTeaser } from '@/components/home/OverlapTeaser'
import { CompareProvider } from '@/lib/context/CompareContext'
import { CompareTray } from '@/components/tools/CompareTray'
import { getHomepageData } from '@/lib/supabase/queries/homepage'

import { SocialProofBar } from '@/components/home/SocialProofBar'
import { JsonLd } from '@/components/common/JsonLd'
import { SITE_URL } from '@/lib/constants/site'
import { AuthCTALink } from '@/components/home/AuthCTALink'

export const revalidate = 60

export const metadata = {
  title: 'AIPowerStacks | Track Your AI Spend & Stop Overpaying',
  description: 'How much are you spending on AI tools? Track subscriptions, detect overlap, and find where you\'re overspending. 490+ tools with real pricing data.',
  alternates: {
    canonical: '/',
  },
}

export default async function HomePage() {
  const { siteStats, mostTracked, overlaps, latestPosts, calcTools, categories } = await getHomepageData()

  const briefingItems = latestPosts
    .filter((post) => post.published_at)
    .map((post) => ({
      id: post.id,
      title: post.title,
      url: `/blog/${post.slug}`,
      source_name: post.author_display_name ?? 'AIPowerStacks',
      image_url: post.cover_image_url,
      published_at: post.published_at ?? new Date().toISOString(),
    }))

  return (
    <CompareProvider>
      <Navbar />
      <main className="min-h-[100dvh] pt-20 flex flex-col gap-20 md:gap-28 pb-32">
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'AIPowerStacks - Track Your AI Spend',
          description: 'Track AI subscriptions, detect overlap, and stop overpaying.',
          url: SITE_URL,
        }} />

        {/* ═══ Hero ═══ */}
        <section className="relative px-4 max-w-5xl mx-auto w-full pt-12 sm:pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary mb-4">{siteStats.toolCount}+ tools tracked</p>
              <h1 className="text-[clamp(2.5rem,5.5vw,4rem)] font-extrabold tracking-[-0.03em] text-foreground leading-[1.05] text-wrap-balance">
                How much is AI costing you?
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-[48ch]">
                Track your AI subscriptions. See what overlaps. Cut what you don&apos;t need.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <AuthCTALink fallbackHref="/login?redirectTo=/tracker" authHref="/tracker">
                  <Button size="lg" className="btn-glow font-bold gap-2 h-12 px-8 text-base">
                    Track My AI Spend
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </AuthCTALink>
                <Link href="/compare">
                  <Button size="lg" variant="outline" className="font-bold border-foreground/10 h-12 px-6 text-muted-foreground hover:text-foreground">
                    Compare Tools
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground/70">
                Free to use · Updated daily · No credit card required
              </p>
            </div>
            {/* Right — Stats cluster */}
            <div className="hidden lg:grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-foreground/[0.06] bg-white dark:bg-card p-5">
                <p className="text-3xl font-black tabular-nums text-foreground">{siteStats.toolCount}+</p>
                <p className="text-xs text-muted-foreground mt-1">AI tools with real pricing</p>
              </div>
              <div className="rounded-xl border border-foreground/[0.06] bg-white dark:bg-card p-5">
                <p className="text-3xl font-black tabular-nums text-foreground">$120</p>
                <p className="text-xs text-muted-foreground mt-1">avg. monthly AI spend per team</p>
              </div>
              <div className="rounded-xl border border-foreground/[0.06] bg-white dark:bg-card p-5">
                <p className="text-3xl font-black tabular-nums text-primary">2-3x</p>
                <p className="text-xs text-muted-foreground mt-1">tools doing the same job</p>
              </div>
              <div className="rounded-xl border border-foreground/[0.06] bg-white dark:bg-card p-5">
                <p className="text-3xl font-black tabular-nums text-foreground">{categories.length}</p>
                <p className="text-xs text-muted-foreground mt-1">categories compared</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Calculator Section ═══ */}
        <section className="px-4 max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">Calculate your spend</h2>
            <p className="text-base text-foreground font-medium">Tap the tools you pay for — see your total in seconds.</p>
          </div>
          <div className="max-w-xl">
            <CostCalculator tools={calcTools} />
          </div>
        </section>

        {/* ═══ Social Proof ═══ */}
        <section className="px-4 max-w-4xl mx-auto w-full">
          <SocialProofBar toolCount={siteStats.toolCount} categoryCount={categories.length} />
        </section>

        {/* ═══ How it works — horizontal steps ═══ */}
        <section className="px-4 max-w-4xl mx-auto w-full">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-8">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-4">
            <div className="flex sm:flex-col gap-4 sm:gap-3">
              <span className="shrink-0 w-8 h-8 rounded-full border-2 border-foreground/20 flex items-center justify-center text-xs font-bold text-foreground">1</span>
              <div>
                <p className="font-semibold text-sm mb-0.5">Add your stack</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Tap the tools you pay for. Takes 10 seconds.</p>
              </div>
            </div>
            <div className="flex sm:flex-col gap-4 sm:gap-3">
              <span className="shrink-0 w-8 h-8 rounded-full border-2 border-foreground/20 flex items-center justify-center text-xs font-bold text-foreground">2</span>
              <div>
                <p className="font-semibold text-sm mb-0.5">See the overlap</p>
                <p className="text-xs text-muted-foreground leading-relaxed">We flag tools competing for the same job.</p>
              </div>
            </div>
            <div className="flex sm:flex-col gap-4 sm:gap-3">
              <span className="shrink-0 w-8 h-8 rounded-full border-2 border-foreground/20 flex items-center justify-center text-xs font-bold text-foreground">3</span>
              <div>
                <p className="font-semibold text-sm mb-0.5">Cut the waste</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Compare overlaps side-by-side. You decide what stays.</p>
              </div>
            </div>
            <div className="flex sm:flex-col gap-4 sm:gap-3">
              <span className="shrink-0 w-8 h-8 rounded-full border-2 border-primary text-primary flex items-center justify-center text-xs font-bold">4</span>
              <div>
                <p className="font-semibold text-sm mb-0.5">Save every month</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Your savings report shows exactly where to cut.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Most Tracked ═══ */}
        {mostTracked.length > 0 && (
          <section className="px-4 max-w-4xl mx-auto w-full">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-6">Most tracked right now</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {mostTracked.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="rounded-xl border border-foreground/[0.06] bg-white dark:bg-card p-4 flex items-center gap-3 hover:border-primary/30 hover:translate-y-[-1px] hover:shadow-sm transition-all duration-200 group"
                >
                  {tool.logo_url ? (
                    <img src={tool.logo_url} alt={tool.name} className="w-9 h-9 rounded-lg object-contain shrink-0" />
                  ) : (
                    <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{tool.name?.[0] || '?'}</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors truncate">{tool.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {tool.avg_cost > 0 ? `~$${tool.avg_cost}/mo` : tool.pricing_model}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══ Overlap Teaser ═══ */}
        <OverlapTeaser overlaps={overlaps} />

        {/* ═══ CTA ═══ */}
        <section className="px-4 max-w-4xl mx-auto w-full">
          <div className="rounded-2xl bg-foreground dark:bg-white/[0.04] p-8 sm:p-12 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-background dark:text-foreground leading-tight">
                Find out which tools to cancel.
              </h2>
              <p className="text-sm text-background/70 dark:text-muted-foreground mt-2 max-w-md">
                We&apos;ll flag overlap and show you exactly where to cut — you make the call.
              </p>
            </div>
            <AuthCTALink fallbackHref="/login?redirectTo=/tracker" authHref="/tracker">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 dark:bg-primary dark:text-white dark:hover:bg-primary/90 font-bold gap-2 h-12 px-8 text-base whitespace-nowrap">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </AuthCTALink>
          </div>
        </section>

        {/* ═══ Newsletter + Submit ═══ */}
        <section className="px-4 max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-px bg-foreground/[0.06] border border-foreground/[0.06] rounded-2xl overflow-hidden">
            <div className="p-6 sm:p-10 flex flex-col gap-5 bg-background">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary mb-3">The AI Stack Report</h2>
                <p className="text-xl font-bold leading-tight mb-2">Weekly AI cost intelligence</p>
                <p className="text-sm text-muted-foreground max-w-sm">Price changes, new tools, and where smart teams are cutting spend.</p>
              </div>
              <NewsletterBanner source="homepage-mid" tone="light" />
            </div>
            <div className="p-6 sm:p-10 flex flex-col justify-center gap-4 bg-foreground/[0.02]">
              <div>
                <p className="text-base font-bold text-foreground">Built an AI tool?</p>
                <p className="text-sm text-muted-foreground mt-1">Get in front of teams actively comparing solutions.</p>
              </div>
              <Link
                href="/submit"
                className="self-start inline-flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold border border-foreground/15 hover:border-primary/40 hover:text-primary transition-colors"
              >
                Submit Your Tool <ArrowRight className="h-3.5 w-3.5" />
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
                          sizes="(max-width: 640px) 75vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-32 sm:h-36 bg-muted/30" />
                    )}
                    <div className="p-3.5 sm:p-4 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        {news.source_name}
                      </span>
                      <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {news.title}
                      </h3>
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
        <section className="px-4 max-w-4xl mx-auto w-full">
          <p className="text-sm text-muted-foreground mb-3">
            Looking for a specific tool?
          </p>
          <div className="flex gap-5 flex-wrap">
            <Link href="/tools" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Browse {siteStats.toolCount}+ tools
            </Link>
            <Link href="/categories" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Categories
            </Link>
            <Link href="/compare" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Compare tools
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <CompareTray />
    </CompareProvider>
  )
}
