import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
import { CostCalculator } from '@/components/home/CostCalculator'
import { OverlapTeaser } from '@/components/home/OverlapTeaser'
import { CompareProvider } from '@/lib/context/CompareContext'
import { CompareTray } from '@/components/tools/CompareTray'
import { getHomepageData } from '@/lib/supabase/queries/homepage'

// Social proof is now integrated into hero stats grid
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
        <section className="relative px-4 max-w-5xl mx-auto w-full pt-16 sm:pt-28 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-20 items-start">
            {/* Left — Copy */}
            <div className="max-w-[540px]">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/90 mb-5 flex items-center gap-2">
                <span className="w-5 h-px bg-primary/60" />
                {siteStats.toolCount}+ tools tracked
              </p>
              <h1 className="text-[clamp(2.75rem,6vw,4.5rem)] font-extrabold tracking-[-0.035em] text-foreground leading-[0.98]">
                How much is
                <br />
                <span className="text-primary">AI</span> costing you?
              </h1>
              <p className="mt-6 text-[1.125rem] text-muted-foreground leading-[1.6] max-w-[44ch]">
                Track your AI subscriptions. See what overlaps.
                <br className="hidden sm:block" />
                Cut what you don&apos;t need.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <AuthCTALink fallbackHref="/login?redirectTo=/tracker" authHref="/tracker">
                  <Button size="lg" className="btn-glow font-bold gap-2.5 h-[52px] px-8 text-[15px] rounded-xl">
                    Track My AI Spend
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </AuthCTALink>
                <Link href="/compare">
                  <Button size="lg" variant="ghost" className="font-medium h-[52px] px-5 text-[15px] text-muted-foreground hover:text-foreground">
                    Compare Tools
                  </Button>
                </Link>
              </div>
              <p className="mt-5 text-[11px] text-muted-foreground/60 tracking-wide">
                Free forever · No credit card · Updated daily
              </p>
            </div>
            {/* Right — Stats with personality */}
            <div className="hidden lg:flex flex-col gap-4 pt-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-foreground/[0.05] p-6 bg-white dark:bg-card">
                  <p className="text-[2.5rem] font-black tabular-nums text-foreground leading-none">{siteStats.toolCount}+</p>
                  <p className="text-[11px] text-muted-foreground mt-2 tracking-wide">AI tools with real pricing</p>
                </div>
                <div className="rounded-2xl border border-foreground/[0.05] p-6 bg-white dark:bg-card">
                  <p className="text-[2.5rem] font-black tabular-nums text-foreground leading-none">$120</p>
                  <p className="text-[11px] text-muted-foreground mt-2 tracking-wide">avg. monthly AI spend</p>
                </div>
              </div>
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.03] dark:bg-primary/[0.06] p-6">
                <p className="text-[2.5rem] font-black tabular-nums text-primary leading-none">2-3x</p>
                <p className="text-[13px] text-foreground/80 mt-2 font-medium">overlap — most teams pay for tools that do the same thing</p>
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

        {/* ═══ How it works ═══ */}
        <section className="px-4 max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-10 gap-y-0">
            <div className="hidden sm:flex flex-col items-center">
              <span className="shrink-0 w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">1</span>
              <div className="w-px flex-1 bg-foreground/10" />
            </div>
            <div className="pb-10 sm:pb-12">
              <span className="sm:hidden text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Step 1</span>
              <p className="text-lg font-bold text-foreground mb-1">Add your stack</p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">Tap the tools you pay for. Takes 10 seconds — no account needed.</p>
            </div>

            <div className="hidden sm:flex flex-col items-center">
              <span className="shrink-0 w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">2</span>
              <div className="w-px flex-1 bg-foreground/10" />
            </div>
            <div className="pb-10 sm:pb-12">
              <span className="sm:hidden text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Step 2</span>
              <p className="text-lg font-bold text-foreground mb-1">See the overlap</p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">We flag tools competing for the same job in your stack.</p>
            </div>

            <div className="hidden sm:flex flex-col items-center">
              <span className="shrink-0 w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">3</span>
              <div className="w-px flex-1 bg-foreground/10" />
            </div>
            <div className="pb-10 sm:pb-12">
              <span className="sm:hidden text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Step 3</span>
              <p className="text-lg font-bold text-foreground mb-1">Cut the waste</p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">Compare overlaps side-by-side. You decide what stays.</p>
            </div>

            <div className="hidden sm:flex flex-col items-center">
              <span className="shrink-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">4</span>
            </div>
            <div>
              <span className="sm:hidden text-[11px] font-bold text-primary uppercase tracking-widest mb-1 block">Step 4</span>
              <p className="text-lg font-bold text-primary mb-1">Save every month</p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">Your personalized savings report shows exactly where to cut.</p>
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
          <div className="rounded-3xl bg-foreground dark:bg-white/[0.05] p-10 sm:p-16 relative overflow-hidden">
            <div className="relative z-10 max-w-lg">
              <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold tracking-[-0.02em] text-background dark:text-foreground leading-[1.1]">
                Find out which tools
                <br />to cancel.
              </h2>
              <p className="text-[15px] text-background/60 dark:text-muted-foreground mt-4 max-w-sm leading-relaxed">
                We&apos;ll flag overlap and show you exactly where to cut — you make the call.
              </p>
              <AuthCTALink fallbackHref="/login?redirectTo=/tracker" authHref="/tracker" className="mt-8 inline-block">
                <Button size="lg" className="bg-background text-foreground hover:bg-background/90 dark:bg-primary dark:text-white dark:hover:bg-primary/90 font-bold gap-2.5 h-[52px] px-8 text-[15px] rounded-xl">
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </AuthCTALink>
            </div>
            {/* Subtle background element */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.04] pointer-events-none" aria-hidden="true">
              <div className="absolute inset-0 bg-gradient-to-l from-background/80 to-transparent" />
            </div>
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
          <section className="px-4 max-w-4xl mx-auto w-full">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">From the blog</h2>
                <p className="text-base text-foreground font-medium">AI cost intel, updated weekly.</p>
              </div>
              <Link href="/blog" className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                All posts <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex sm:grid sm:grid-cols-3 gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              {briefingItems.map((news) => (
                <Link
                  key={news.id}
                  href={news.url}
                  className="group flex flex-col min-w-[72vw] sm:min-w-0 snap-start"
                >
                  {news.image_url ? (
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-muted/20">
                      <Image
                        src={news.image_url}
                        alt={news.title}
                        fill
                        sizes="(max-width: 640px) 72vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] rounded-xl bg-muted/20 mb-3" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 mb-1.5">
                    {new Date(news.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <h3 className="font-bold text-[15px] leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {news.title}
                  </h3>
                </Link>
              ))}
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
