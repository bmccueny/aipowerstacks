import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { JsonLd } from '@/components/common/JsonLd'
import { SITE_URL } from '@/lib/constants/site'
import { BEST_PAGE_CONFIGS } from '@/lib/constants/best-pages'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Best AI Tools by Category — Curated Lists | AIPowerStacks',
  description: 'Browse curated lists of the best AI tools by category. From writing to coding to image generation — find top-rated tools for every use case.',
  alternates: { canonical: '/best' },
  openGraph: {
    title: 'Best AI Tools by Category — Curated Lists',
    description: 'Browse curated lists of the best AI tools by category.',
    url: `${SITE_URL}/best`,
  },
}

export default function BestIndexPage() {
  const pages = Object.entries(BEST_PAGE_CONFIGS)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Best AI Tools', item: `${SITE_URL}/best` },
    ],
  }

  return (
    <div className="page-shell max-w-5xl mx-auto pb-24">
      <JsonLd data={breadcrumbJsonLd} />

      <nav className="text-xs text-muted-foreground mb-8 flex items-center gap-1.5">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Best AI Tools</span>
      </nav>

      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          Best AI Tools by Category
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Curated lists of the top AI tools across every category. Each list is ranked by
          community ratings, features, and value.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map(([slug, config]) => (
          <Link
            key={slug}
            href={`/best/${slug}`}
            className="glass-card rounded-xl p-5 flex flex-col hover:border-primary/25 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm group-hover:text-primary transition-colors">
                {config.title}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
              {config.description}
            </p>
            <div className="flex items-center gap-1 text-xs text-primary font-medium">
              View list <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
