import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BEST_PAGE_CONFIGS } from '@/lib/constants/best-pages'
import type { ToolSearchResult } from '@/lib/types'

type Props = {
  toolSlug: string
  categorySlug: string | null
  alternatives: ToolSearchResult[]
}

/** Find the best-of page slug that matches a category */
function findBestPageForCategory(categorySlug: string | null): string | null {
  if (!categorySlug) return null
  for (const [slug, config] of Object.entries(BEST_PAGE_CONFIGS)) {
    if (config.categorySlug === categorySlug) return slug
  }
  return null
}

export function RelatedPages({ toolSlug, categorySlug, alternatives }: Props) {
  const bestPageSlug = findBestPageForCategory(categorySlug)
  const topAlternative = alternatives[0]

  const links: { href: string; label: string }[] = [
    { href: `/alternatives/to-${toolSlug}`, label: 'View all alternatives' },
  ]

  if (topAlternative) {
    links.push({
      href: `/compare/${toolSlug}-vs-${topAlternative.slug}`,
      label: `Compare with ${topAlternative.name}`,
    })
  }

  if (bestPageSlug) {
    links.push({
      href: `/best/${bestPageSlug}`,
      label: BEST_PAGE_CONFIGS[bestPageSlug].title,
    })
  }

  // Always link to the free tools list if no category match
  if (!bestPageSlug) {
    links.push({ href: '/best/free-ai-tools', label: 'Best Free AI Tools' })
  }

  return (
    <div className="mt-8 mb-8 max-w-5xl mx-auto">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
        Related Pages
      </h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-full px-3 py-1.5 transition-colors"
          >
            {link.label}
            <ArrowRight className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </div>
  )
}
