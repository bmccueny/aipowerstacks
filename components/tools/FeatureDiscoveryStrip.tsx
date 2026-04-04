import Link from 'next/link'
import { Sparkles, ArrowLeftRight, Zap, Layers } from 'lucide-react'

interface FeatureDiscoveryStripProps {
  toolName: string
  toolSlug: string
  categorySlug: string | null
}

const features = [
  {
    title: 'Find your perfect tool',
    subtitle: 'Describe what you need, AI finds it',
    icon: Sparkles,
    href: '/matchmaker',
  },
  {
    title: 'See alternatives',
    subtitle: 'Compare similar tools side by side',
    icon: ArrowLeftRight,
    getHref: (slug: string) => `/alternatives/${slug}`,
  },
  {
    title: 'Browse workflow recipes',
    subtitle: 'Pre-built stacks for common workflows',
    icon: Zap,
    href: '/blueprints',
  },
  {
    title: 'Explore community stacks',
    subtitle: 'See how others combine their tools',
    icon: Layers,
    href: '/stacks',
  },
] as const

export function FeatureDiscoveryStrip({ toolSlug }: FeatureDiscoveryStripProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <p className="text-sm font-medium text-muted-foreground text-center mb-5 flex items-center justify-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        Discover more
      </p>
      <div className="glass-card p-4">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
          {features.map((feature) => {
            const Icon = feature.icon
            const href = 'getHref' in feature ? feature.getHref(toolSlug) : feature.href
            return (
              <Link
                key={feature.title}
                href={href}
                className="min-w-[70vw] md:min-w-0 snap-start rounded-xl border border-foreground/[0.06] p-4 hover:border-primary/25 hover:shadow-sm transition-all"
              >
                <Icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-bold">{feature.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{feature.subtitle}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
