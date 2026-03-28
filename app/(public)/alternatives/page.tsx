import Link from 'next/link'
import { Star, ArrowRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/common/JsonLd'
import { PRICING_LABELS, PRICING_BADGE_COLORS } from '@/lib/constants'
import { SITE_URL } from '@/lib/constants/site'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

type IndexTool = {
  name: string
  slug: string
  tagline: string
  logo_url: string | null
  pricing_model: string
  avg_rating: number
  review_count: number
  categories: { name: string; slug: string } | null
}

export const metadata: Metadata = {
  title: 'AI Tool Alternatives — Find the Best Replacement | AIPowerStacks',
  description: 'Browse alternatives to popular AI tools. Compare pricing, features, and ratings to find the perfect replacement for any AI tool.',
  alternates: { canonical: '/alternatives' },
  openGraph: {
    title: 'AI Tool Alternatives — Find the Best Replacement',
    description: 'Browse alternatives to popular AI tools. Compare pricing, features, and ratings.',
    url: `${SITE_URL}/alternatives`,
  },
}

export default async function AlternativesIndexPage() {
  const supabase = createAdminClient()

  const { data: rawTools } = await supabase
    .from('tools')
    .select('name, slug, tagline, logo_url, pricing_model, avg_rating, review_count, categories:category_id(name, slug)')
    .eq('status', 'published')
    .order('upvote_count', { ascending: false })
    .limit(100)

  const tools = (rawTools ?? []) as unknown as IndexTool[]

  // Group by category
  const byCategory = new Map<string, { categoryName: string; categorySlug: string; tools: IndexTool[] }>()
  for (const tool of tools) {
    const key = tool.categories?.slug ?? 'uncategorized'
    if (!byCategory.has(key)) {
      byCategory.set(key, {
        categoryName: tool.categories?.name ?? 'Other',
        categorySlug: key,
        tools: [],
      })
    }
    byCategory.get(key)!.tools.push(tool)
  }

  const categories = Array.from(byCategory.values())
    .filter((c) => c.tools.length >= 2)
    .sort((a, b) => b.tools.length - a.tools.length)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Alternatives', item: `${SITE_URL}/alternatives` },
    ],
  }

  return (
    <div className="page-shell max-w-5xl mx-auto pb-24">
      <JsonLd data={breadcrumbJsonLd} />

      <nav className="text-xs text-muted-foreground mb-8 flex items-center gap-1.5">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Alternatives</span>
      </nav>

      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          AI Tool Alternatives
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Find the best alternatives to popular AI tools. Browse by category and compare
          pricing, features, and ratings to make the right choice.
        </p>
      </div>

      {categories.map((cat) => (
        <section key={cat.categorySlug} className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{cat.categoryName}</h2>
            <Link href={`/categories/${cat.categorySlug}`} className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cat.tools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/alternatives/to-${tool.slug}`}
                className="glass-card rounded-xl p-4 flex items-center gap-3 hover:border-primary/25 hover:shadow-md transition-all group"
              >
                <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {tool.logo_url ? (
                    <img src={tool.logo_url} alt={tool.name} width={40} height={40} className="object-contain" />
                  ) : (
                    <span className="text-sm font-black text-primary">{tool.name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                      {tool.name} Alternatives
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] font-bold', PRICING_BADGE_COLORS[tool.pricing_model] ?? '')}
                    >
                      {PRICING_LABELS[tool.pricing_model] ?? 'Unknown'}
                    </Badge>
                    {tool.avg_rating > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                        {tool.avg_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
