import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { PRICING_LABELS, PRICING_BADGE_COLORS } from '@/lib/constants'
import { SITE_URL } from '@/lib/constants/site'
import { cn } from '@/lib/utils'
import { ChevronRight, DollarSign } from 'lucide-react'
import { JsonLd } from '@/components/common/JsonLd'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'AI Tool Pricing Guide 2026 | Compare Plans & Costs',
  description: 'Compare pricing plans for 400+ AI tools. Find the cheapest plan, free tiers, and best value tools across every category.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'AI Tool Pricing Guide 2026 | Compare Plans & Costs',
    description: 'Compare pricing plans for 400+ AI tools. Find the cheapest plan, free tiers, and best value tools across every category.',
    url: `${SITE_URL}/pricing`,
  },
}

type TierRow = {
  tool_id: string
  tier_name: string
  monthly_price: number
}

type ToolWithCategory = {
  id: string
  name: string
  slug: string
  tagline: string
  logo_url: string | null
  pricing_model: string
  avg_rating: number
  review_count: number
  categories: { name: string; slug: string } | null
}

type GroupedTool = ToolWithCategory & {
  cheapestPrice: number | null
  tierCount: number
}

type CategoryGroup = {
  name: string
  slug: string
  tools: GroupedTool[]
}

export default async function PricingIndexPage() {
  const supabase = createAdminClient()

  // Fetch all tiers (cheapest per tool) and tool info in parallel
  const [tiersRes, toolsRes] = await Promise.all([
    supabase
      .from('tool_pricing_tiers')
      .select('tool_id, tier_name, monthly_price')
      .order('monthly_price', { ascending: true })
      .limit(2000),
    supabase
      .from('tools')
      .select('id, name, slug, tagline, logo_url, pricing_model, avg_rating, review_count, categories:category_id(name, slug)')
      .eq('status', 'published')
      .order('avg_rating', { ascending: false })
      .limit(2000),
  ])

  const tiers = (tiersRes.data ?? []) as TierRow[]
  const tools = (toolsRes.data ?? []) as unknown as ToolWithCategory[]

  // Build a map: tool_id → { cheapestPaidPrice, tierCount }
  const tierCountMap = new Map<string, number>()
  const cheapestMap = new Map<string, number>()
  const toolIdsWithTiers = new Set<string>()

  for (const t of tiers) {
    toolIdsWithTiers.add(t.tool_id)
    tierCountMap.set(t.tool_id, (tierCountMap.get(t.tool_id) ?? 0) + 1)
    if (t.monthly_price > 0 && !cheapestMap.has(t.tool_id)) {
      cheapestMap.set(t.tool_id, t.monthly_price)
    }
  }

  // Filter tools that have tiers
  const toolsWithTiers = tools.filter((t) => toolIdsWithTiers.has(t.id))

  // Group by category
  const categoryMap = new Map<string, CategoryGroup>()
  const uncategorized: GroupedTool[] = []

  for (const tool of toolsWithTiers) {
    const enriched: GroupedTool = {
      ...tool,
      cheapestPrice: cheapestMap.get(tool.id) ?? null,
      tierCount: tierCountMap.get(tool.id) ?? 0,
    }

    if (tool.categories) {
      const key = tool.categories.slug
      if (!categoryMap.has(key)) {
        categoryMap.set(key, { name: tool.categories.name, slug: tool.categories.slug, tools: [] })
      }
      categoryMap.get(key)!.tools.push(enriched)
    } else {
      uncategorized.push(enriched)
    }
  }

  const categories = [...categoryMap.values()].sort((a, b) => b.tools.length - a.tools.length)
  if (uncategorized.length > 0) {
    categories.push({ name: 'Other', slug: 'other', tools: uncategorized })
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'AI Tool Pricing Guide', item: `${SITE_URL}/pricing` },
    ],
  }

  return (
    <div className="page-shell max-w-5xl mx-auto pb-24">
      <JsonLd data={breadcrumbJsonLd} />

      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground mb-8 flex items-center gap-1.5">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Pricing Guide</span>
      </nav>

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            AI Tool Pricing Guide 2026
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Compare pricing plans for {toolsWithTiers.length}+ AI tools. Browse by category to find free tiers,
          cheapest paid plans, and the best value tools for your workflow.
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>{toolsWithTiers.length} tools with pricing data</span>
          <span>·</span>
          <span>{categories.length} categories</span>
        </div>
      </div>

      {/* Category sections */}
      <div className="space-y-10">
        {categories.map((category) => (
          <section key={category.slug}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black tracking-tight">{category.name}</h2>
              <span className="text-xs text-muted-foreground">{category.tools.length} tools</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/pricing/${tool.slug}`}
                  className="glass-card rounded-xl p-4 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                      {tool.logo_url ? (
                        <img src={tool.logo_url} alt={tool.name} width={36} height={36} className="object-contain" />
                      ) : (
                        <span className="text-sm font-black text-primary">{tool.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                          {tool.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs font-bold shrink-0', PRICING_BADGE_COLORS[tool.pricing_model] ?? '')}
                        >
                          {PRICING_LABELS[tool.pricing_model] ?? tool.pricing_model}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {tool.tierCount} plan{tool.tierCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-sm font-black shrink-0">
                          {tool.cheapestPrice != null
                            ? `from $${tool.cheapestPrice % 1 === 0 ? tool.cheapestPrice.toFixed(0) : tool.cheapestPrice.toFixed(2)}/mo`
                            : <span className="text-emerald-600">Free</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {toolsWithTiers.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <DollarSign className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p>Pricing data is being collected. Check back soon.</p>
        </div>
      )}
    </div>
  )
}
