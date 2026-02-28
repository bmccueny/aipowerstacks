import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, BarChart3, Star, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeaturedCheckout } from '@/components/advertise/FeaturedCheckout'

export const metadata: Metadata = {
  title: 'Go Featured — AIPowerStacks',
  description: 'Get your AI tool in front of high-intent buyers. Featured listing includes top placement, stronger visibility, and faster discovery.',
}

const perks = [
  { icon: TrendingUp, title: 'Top-of-list placement', desc: 'Show up above standard listings in your category, right where buyers start scanning.' },
  { icon: BadgeCheck, title: 'Trust signal on card', desc: 'Get a premium visual marker that helps buyers notice your listing faster.' },
  { icon: BarChart3, title: 'Homepage exposure', desc: 'Rotate into homepage highlights where high-intent traffic is strongest.' },
  { icon: Star, title: 'Roundup consideration', desc: 'Get prioritized when we assemble weekly and monthly tool shortlists.' },
  { icon: Zap, title: 'Launch in minutes', desc: 'Checkout, activate, and go live quickly without manual back-and-forth.' },
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
          Get in front of high-intent<br />AI tool buyers
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Reach decision-stage visitors already comparing solutions, not cold traffic.
          Featured placement helps your tool get seen before alternatives.
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
        <p className="text-sm text-muted-foreground mb-8">No annual contract. Cancel anytime. Goes live in minutes.</p>

        <p className="text-sm font-semibold mb-3">Paste your AIPowerStacks URL or tool slug</p>
        <FeaturedCheckout />

        <p className="text-xs text-muted-foreground mt-5">
          Not listed yet?{' '}
          <Link href="/submit" className="underline underline-offset-4 font-semibold hover:text-foreground transition-colors">
            Submit your tool first — takes two minutes
          </Link>
          {' '}— then come back to upgrade.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="glass-card rounded-[10px] p-5">
          <p className="text-sm font-semibold mb-2">Trust & transparency</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Featured placements are clearly labeled for users.</li>
            <li>• Editorial coverage and sponsorship placement are kept separate.</li>
            <li>• Monthly billing with self-serve cancellation.</li>
          </ul>
        </div>
        <div className="glass-card rounded-[10px] p-5">
          <p className="text-sm font-semibold mb-2">What to expect</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Immediate homepage/category visibility after checkout.</li>
            <li>• More qualified clicks from users actively comparing tools.</li>
            <li>• Best performance when paired with strong reviews and clear value props.</li>
          </ul>
        </div>
      </div>

      <div className="gum-card rounded-[10px] p-6">
        <p className="font-bold mb-1">Questions before you launch?</p>
        <p className="text-sm text-muted-foreground mb-3">
          Read the{' '}
          <Link href="/blog" className="underline underline-offset-4">AI briefing</Link>
          {' '}to see how we cover tools, or{' '}
          <a href="mailto:hello@aipowerstacks.com" className="underline underline-offset-4">email us</a>
          {' '}for volume pricing on multiple tools.
        </p>
        <Link href="/tools">
          <Button variant="outline" size="sm" className="gap-1.5">
            Browse directory <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
