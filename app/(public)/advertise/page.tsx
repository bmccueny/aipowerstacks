import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/constants/site'
import { ArrowRight, BadgeCheck, BarChart3, Star, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeaturedCheckout } from '@/components/advertise/FeaturedCheckout'

export const metadata: Metadata = {
  title: 'Featured Listings for AI Tools',
  description: 'Put your AI tool in front of buyers actively comparing solutions. Featured placement starts at $99/mo with instant activation.',
  alternates: { canonical: '/advertise' },
  openGraph: {
    title: 'Featured Listings for AI Tools',
    description: 'Put your AI tool in front of buyers actively comparing solutions. Featured placement starts at $99/mo with instant activation.',
    url: `${SITE_URL}/advertise`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Featured Listings for AI Tools',
    description: 'Put your AI tool in front of buyers actively comparing solutions. Featured placement starts at $99/mo with instant activation.',
  },
}

const perks = [
  { icon: TrendingUp, title: 'Top-of-category placement', desc: 'Appear above organic listings in your category — the first thing buyers scan.' },
  { icon: BadgeCheck, title: 'Verified badge on your card', desc: 'A visual trust signal that increases click-through rates by standing out in search results.' },
  { icon: BarChart3, title: 'Homepage rotation', desc: 'Get featured on the homepage where 60%+ of high-intent traffic lands first.' },
  { icon: Star, title: 'Weekly roundup inclusion', desc: 'Priority placement in our Friday newsletter sent to thousands of decision-makers.' },
  { icon: Zap, title: 'Live in under 5 minutes', desc: 'Self-serve checkout. No sales calls, no contracts, no waiting.' },
]

export default function AdvertisePage() {
  return (
    <div className="page-shell max-w-5xl">
      <div className="page-hero text-center mb-10">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-5">
          <TrendingUp className="h-3.5 w-3.5" />
          Go Featured
        </div>
        <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
          Reach buyers who are already<br />comparing AI tools
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          These visitors are mid-decision, not cold. Featured placement puts your tool
          in front of them before they pick a competitor.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {perks.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="gum-card rounded-[10px] p-5 flex gap-4 items-start">
            <div className="h-9 w-9 shrink-0 rounded-lg border-2 border-black bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-sm mb-0.5">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="gum-card rounded-3xl p-8 sm:p-10 bg-primary/10 text-center mb-8">
        <p className="text-4xl font-black mb-1">$99 <span className="text-xl font-semibold text-muted-foreground">/ month</span></p>
        <p className="text-sm text-muted-foreground mb-8">Month-to-month. Cancel anytime. Live in minutes, not days.</p>

        <p className="text-sm font-semibold mb-3">Paste your AIPowerStacks tool URL or slug</p>
        <FeaturedCheckout />

        <p className="text-xs text-muted-foreground mt-5">
          Not listed yet?{' '}
          <Link href="/submit" className="underline underline-offset-4 font-semibold hover:text-foreground transition-colors">
            Submit your tool first (free, 2 minutes)
          </Link>
          {' '}then come back to upgrade.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="glass-card rounded-[10px] p-5">
          <p className="text-sm font-semibold mb-2">Trust & transparency</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Featured placements are always labeled — no hidden ads.</li>
            <li>• Editorial rankings and paid placement are completely separate.</li>
            <li>• Self-serve billing. Cancel from your dashboard in one click.</li>
          </ul>
        </div>
        <div className="glass-card rounded-[10px] p-5">
          <p className="text-sm font-semibold mb-2">What to expect</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Instant visibility on your category page and homepage after checkout.</li>
            <li>• Higher-quality clicks from users actively shortlisting tools.</li>
            <li>• Strongest results when your listing has solid reviews and a clear value prop.</li>
          </ul>
        </div>
      </div>

      <div className="gum-card rounded-[10px] p-6">
        <p className="font-bold mb-1">Questions? We respond same-day.</p>
        <p className="text-sm text-muted-foreground mb-3">
          Read our{' '}
          <Link href="/blog" className="underline underline-offset-4">AI tool briefings</Link>
          {' '}to see editorial standards, or{' '}
          <a href="mailto:hello@aipowerstacks.com" className="underline underline-offset-4">email us</a>
          {' '}for volume pricing on 3+ tools.
        </p>
        <Link href="/tools">
          <Button variant="outline" size="sm" className="gap-1.5">
            Browse the directory <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
