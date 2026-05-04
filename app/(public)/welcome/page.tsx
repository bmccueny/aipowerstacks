import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CostCalculator } from '@/components/home/CostCalculator'
import { getHomepageData } from '@/lib/supabase/queries/homepage'
import { AuthCTALink } from '@/components/home/AuthCTALink'

export const metadata: Metadata = {
  title: 'AIPowerStacks | Track Your AI Spend & Stop Overpaying',
  description: 'The average team spends $120/mo on AI tools. Most are paying for 2-3 tools that do the same thing. Find out which ones to cancel.',
}

export const revalidate = 60

export default async function WelcomePage() {
  const { siteStats, calcTools } = await getHomepageData()

  return (
    <div className="pt-4 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* PH Badge */}
        <div className="flex items-center gap-2 mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff6154]/10 text-[#ff6154] text-xs font-bold border border-[#ff6154]/20">
            <svg width="14" height="14" viewBox="0 0 40 40" fill="currentColor"><path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 36.8C10.728 36.8 3.2 29.272 3.2 20S10.728 3.2 20 3.2 36.8 10.728 36.8 20 29.272 36.8 20 36.8zm2-24.8h-8v16h4v-4h4c3.314 0 6-2.686 6-6s-2.686-6-6-6zm0 8h-4v-4h4c1.104 0 2 .896 2 2s-.896 2-2 2z"/></svg>
            Featured on Product Hunt
          </span>
        </div>

        {/* Hero — straight to the point */}
        <div className="max-w-xl mb-12">
          <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-bold tracking-[-0.03em] leading-[1.05]">
            How much is AI
            <br /><span className="text-primary">costing</span> you?
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-[46ch]">
            The average team spends $120/mo on AI tools. Most are paying for 2-3 that do the same thing. Find your overlap in 10 seconds.
          </p>
        </div>

        {/* Value props — horizontal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <Check className="h-3 w-3 text-primary" />
            </span>
            <div>
              <p className="text-sm font-semibold">700+ tools tracked</p>
              <p className="text-xs text-muted-foreground">Real pricing, updated daily</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <Check className="h-3 w-3 text-primary" />
            </span>
            <div>
              <p className="text-sm font-semibold">AI overlap detection</p>
              <p className="text-xs text-muted-foreground">Flags tools doing the same job</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <Check className="h-3 w-3 text-primary" />
            </span>
            <div>
              <p className="text-sm font-semibold">Free forever</p>
              <p className="text-xs text-muted-foreground">No premium tier, no catch</p>
            </div>
          </div>
        </div>

        {/* Calculator — the interactive hook */}
        <div className="mb-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">Try it now</h2>
          <p className="text-base font-medium text-foreground mb-6">Tap the tools you pay for — see your total instantly.</p>
          <div className="max-w-xl">
            <CostCalculator tools={calcTools} />
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-[#1C1C1E] dark:bg-card dark:border dark:border-border p-10 max-w-xl">
          <h2 className="text-2xl font-bold text-white dark:text-foreground tracking-tight mb-2">
            Ready to stop overpaying?
          </h2>
          <p className="text-sm text-white/60 dark:text-muted-foreground mb-6">
            Sign up free. Track your subscriptions. We&apos;ll show you exactly where to cut.
          </p>
          <div className="flex flex-wrap gap-3">
            <AuthCTALink fallbackHref="/register?ref=producthunt" authHref="/tracker">
              <Button size="lg" className="bg-white text-[#1C1C1E] hover:bg-white/90 dark:bg-primary dark:text-white font-bold gap-2 h-12 px-8 text-[15px] rounded-xl">
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
            </AuthCTALink>
            <Link href="/stack-advisor">
              <Button size="lg" variant="ghost" className="text-background/70 dark:text-muted-foreground hover:text-background dark:hover:text-foreground font-medium h-12 px-5 text-[15px]">
                Try Stack Advisor
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mt-10 text-sm text-muted-foreground">
          <span><strong className="text-foreground font-black">{siteStats.toolCount}+</strong> tools</span>
          <span><strong className="text-foreground font-black">Free</strong> forever</span>
          <span><strong className="text-foreground font-black">Daily</strong> price updates</span>
        </div>
      </div>
    </div>
  )
}
