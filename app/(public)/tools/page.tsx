import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants/site'
import { searchTools } from '@/lib/supabase/queries/tools'
import { getAllCategories } from '@/lib/supabase/queries/categories'
import { ToolGrid } from '@/components/tools/ToolGrid'
import { ToolGridTransition } from '@/components/tools/ToolGridTransition'
import { ToolFilters } from '@/components/tools/ToolFilters'
import { ToolSearch } from '@/components/tools/ToolSearch'
import { ViewToggle } from '@/components/tools/ViewToggle'
import { Pagination } from '@/components/common/Pagination'
import { PAGE_SIZE } from '@/lib/constants'
import { Sparkles } from 'lucide-react'
import { JsonLd } from '@/components/common/JsonLd'
import { generateItemListJsonLd } from '@/lib/utils/seo'
import type { PricingModel } from '@/lib/types'

interface ToolsPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    pricing?: string
    use_case?: string
    team_size?: string
    integration?: string
    audience?: string
    has_api?: string
    has_mobile?: string
    is_open_source?: string
    sort?: string
    view?: string
    page?: string
  }>
}

export async function generateMetadata({ searchParams }: ToolsPageProps): Promise<Metadata> {
  const params = await searchParams
  const parsedPage = parseInt(params.page ?? '1', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const hasNoisyParams = Boolean(
    params.q ||
    params.category ||
    params.pricing ||
    params.use_case ||
    params.team_size ||
    params.integration ||
    params.audience ||
    params.has_api ||
    params.has_mobile ||
    params.is_open_source ||
    params.sort ||
    params.view
  )

  const canonical = hasNoisyParams
    ? '/tools'
    : page > 1
      ? `/tools?page=${page}`
      : '/tools'

  const title = 'AI Tools Directory - Browse & Compare AI Tools'
  const description = 'Search and compare 300+ AI tools by category, pricing, use case, team size, and integrations. Real user reviews, verified listings, and side-by-side comparisons updated daily.'

  return {
    title,
    description,
    alternates: { canonical },
    robots: hasNoisyParams
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/tools`,
      type: 'website',
      siteName: 'AIPowerStacks',
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'AIPowerStacks AI Tools Directory' }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@aipowerstacks',
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  }
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const params = await searchParams
  const parsedPage = parseInt(params.page ?? '1', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const view = (params.view === 'list' ? 'list' : 'grid') as 'grid' | 'list'

  const [{ tools }, categories] = await Promise.all([
    searchTools({
      query: params.q,
      category: params.category,
      pricing: params.pricing as PricingModel,
      useCase: params.use_case,
      teamSize: params.team_size,
      integration: params.integration,
      audience: params.audience,
      hasApi: params.has_api === 'true',
      hasMobile: params.has_mobile === 'true',
      isOpenSource: params.is_open_source === 'true',
      sort: params.sort ?? 'relevance',
      page,
    }),
    getAllCategories(),
  ])

  const hasMore = tools.length === PAGE_SIZE

  const toolListJsonLd = generateItemListJsonLd(
    tools.map((t, i) => ({ name: t.name, url: `/tools/${t.slug}`, position: (page - 1) * PAGE_SIZE + i + 1 })),
    'AI Tools Directory',
    '/tools',
  )

  return (
    <div className="page-shell space-y-5 sm:space-y-6">
      <JsonLd data={toolListJsonLd} />
      <section className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Search + Filter
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">Find The Right AI Tool Fast</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Compare tools by category, pricing, use case, team size, and integrations in one place.</p>
      </section>

      <div className="glass-card rounded-md p-4 mb-2 space-y-3">
        <Suspense>
          <div className="flex flex-col sm:flex-row gap-3">
            <ToolSearch />
            <ViewToggle />
          </div>
          <ToolFilters categories={categories} />
        </Suspense>
      </div>

      <p className="text-sm text-muted-foreground">
        {tools.length === 0
          ? 'No tools found — try adjusting your filters.'
          : `Showing ${tools.length}${hasMore ? '+' : ''} tool${tools.length === 1 ? '' : 's'}${page > 1 ? ` · Page ${page}` : ''}`}
      </p>

      <Suspense>
        <ToolGridTransition view={view}>
          <ToolGrid tools={tools} view={view} cardStyle="default" />
        </ToolGridTransition>
      </Suspense>

      <Suspense>
        <Pagination page={page} hasMore={hasMore} />
      </Suspense>
    </div>
  )
}
