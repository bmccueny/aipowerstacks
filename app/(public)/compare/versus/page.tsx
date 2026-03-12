import Link from 'next/link'
import { ArrowLeftRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { SITE_URL } from '@/lib/constants/site'
import { JsonLd } from '@/components/common/JsonLd'

type VsIndexTool = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  category_id: string | null
  avg_rating: number
  categories: { name: string; slug: string } | null
}

export const metadata = {
  title: 'AI Tool Comparisons | AIPowerStacks',
  description:
    'Compare popular AI tools side by side. Find the best tool for your workflow with detailed feature comparisons, pricing breakdowns, and user ratings.',
  alternates: { canonical: '/compare/versus' },
  openGraph: {
    title: 'AI Tool Comparisons | AIPowerStacks',
    description:
      'Compare popular AI tools side by side. Find the best tool for your workflow.',
    url: `${SITE_URL}/compare/versus`,
  },
}

export default async function VersusIndexPage() {
  const supabase = createAdminClient()

  // Get top 40 tools by review count, then create pairs from tools in the same category
  const { data: rawTools } = await supabase
    .from('tools')
    .select(
      'id, name, slug, logo_url, category_id, avg_rating, categories:category_id(name, slug)'
    )
    .eq('status', 'published')
    .gt('avg_rating', 0)
    .order('review_count', { ascending: false })
    .limit(40)

  const tools = (rawTools ?? []) as unknown as VsIndexTool[]

  // Group by category and create pairs
  const byCategory = new Map<string, VsIndexTool[]>()
  for (const tool of tools) {
    const catId = tool.category_id
    if (!catId) continue
    if (!byCategory.has(catId)) byCategory.set(catId, [])
    byCategory.get(catId)!.push(tool)
  }

  const pairs: Array<{ a: VsIndexTool; b: VsIndexTool; category: string }> = []
  for (const [, categoryTools] of byCategory) {
    for (let i = 0; i < categoryTools.length && pairs.length < 30; i++) {
      for (let j = i + 1; j < categoryTools.length && pairs.length < 30; j++) {
        pairs.push({
          a: categoryTools[i],
          b: categoryTools[j],
          category: categoryTools[i].categories?.name ?? 'AI Tools',
        })
      }
    }
  }

  return (
    <div className="page-shell max-w-4xl mx-auto pb-24">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'AI Tool Comparisons',
          description:
            'Compare popular AI tools side by side on AIPowerStacks.',
          url: `${SITE_URL}/compare/versus`,
        }}
      />

      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground mb-8 flex items-center gap-1.5">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/compare" className="hover:text-foreground transition-colors">
          Compare
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">All Comparisons</span>
      </nav>

      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          AI Tool Comparisons
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Side-by-side comparisons of the most popular AI tools. Find the
          perfect fit for your workflow.
        </p>
      </div>

      {pairs.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center border-dashed">
          <p className="text-muted-foreground">
            No comparison pairs available yet. Check back soon!
          </p>
        </div>
      )}

      <div className="space-y-3">
        {pairs.map(({ a, b, category }) => (
          <Link
            key={`${a.slug}-${b.slug}`}
            href={`/compare/${a.slug}-vs-${b.slug}`}
            className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all group block"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {a.logo_url ? (
                  <img
                    src={a.logo_url}
                    alt={a.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                ) : (
                  <span className="font-bold text-primary">{a.name[0]}</span>
                )}
              </div>
              <span className="font-semibold truncate">{a.name}</span>
            </div>
            <div className="shrink-0 text-muted-foreground">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
              <span className="font-semibold truncate">{b.name}</span>
              <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {b.logo_url ? (
                  <img
                    src={b.logo_url}
                    alt={b.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                ) : (
                  <span className="font-bold text-primary">{b.name[0]}</span>
                )}
              </div>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] shrink-0 hidden sm:inline-flex"
            >
              {category}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  )
}
