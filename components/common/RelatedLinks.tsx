import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface RelatedLinksProps {
  toolSlug: string
  toolName: string
  categorySlug: string | null
  categoryName: string | null
  categoryId: string
}

export async function RelatedLinks({ toolSlug, toolName, categorySlug, categoryName, categoryId }: RelatedLinksProps) {
  const supabase = await createClient()

  // Fetch related tools in same category
  const { data: related } = await supabase
    .from('tools')
    .select('slug, name, logo_url, tagline')
    .eq('status', 'published')
    .eq('category_id', categoryId)
    .neq('slug', toolSlug)
    .order('avg_rating', { ascending: false })
    .limit(4)

  const relatedTools = related ?? []

  // Check if a /best/ page exists for this category
  const bestSlug = categorySlug ? categorySlug.replace(/^ai-/, '') : null

  const links: { href: string; label: string; sublabel?: string; logo?: string | null }[] = []

  // Alternatives page
  links.push({
    href: `/alternatives/to-${toolSlug}`,
    label: `${toolName} Alternatives`,
    sublabel: `Compare top alternatives to ${toolName}`,
  })

  // Related tools
  for (const tool of relatedTools.slice(0, 3)) {
    links.push({
      href: `/tools/${tool.slug}`,
      label: tool.name,
      sublabel: tool.tagline,
      logo: tool.logo_url,
    })
  }

  // Category page
  if (categorySlug && categoryName) {
    links.push({
      href: `/categories/${categorySlug}`,
      label: `All ${categoryName} Tools`,
      sublabel: `Browse the full ${categoryName} directory`,
    })
  }

  // Best page
  if (bestSlug) {
    links.push({
      href: `/best/${bestSlug}`,
      label: `Best ${categoryName ?? 'AI'} Tools`,
      sublabel: 'Curated top picks',
    })
  }

  if (links.length === 0) return null

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">You might also like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-3 rounded-xl border border-foreground/[0.06] p-3 hover:border-primary/30 transition-all"
          >
            {link.logo ? (
              <div className="h-9 w-9 shrink-0 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                <Image src={link.logo} alt={link.label} width={36} height={36} className="object-cover" />
              </div>
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                {link.label}
              </p>
              {link.sublabel && (
                <p className="text-xs text-muted-foreground truncate">{link.sublabel}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
