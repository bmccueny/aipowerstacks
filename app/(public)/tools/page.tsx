import { Suspense } from 'react'
import type { Metadata } from 'next'
import { searchTools } from '@/lib/supabase/queries/tools'
import { getAllCategories } from '@/lib/supabase/queries/categories'
import { ToolGrid } from '@/components/tools/ToolGrid'
import { ToolFilters } from '@/components/tools/ToolFilters'
import { ToolSearch } from '@/components/tools/ToolSearch'
import { ViewToggle } from '@/components/tools/ViewToggle'
import { Pagination } from '@/components/common/Pagination'
import { PAGE_SIZE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'AI Tools Directory — Browse 5,000+ AI Tools',
  description: 'Search and filter 5,000+ AI tools by category, pricing, and use case.',
}

interface ToolsPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    pricing?: string
    sort?: string
    view?: string
    page?: string
  }>
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const params = await searchParams
  const page = Number(params.page ?? 1)
  const view = (params.view === 'list' ? 'list' : 'grid') as 'grid' | 'list'

  const [{ tools }, categories] = await Promise.all([
    searchTools({
      query: params.q,
      category: params.category,
      pricing: params.pricing,
      sort: params.sort ?? 'relevance',
      page,
    }),
    getAllCategories(),
  ])

  const hasMore = tools.length === PAGE_SIZE

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Tools Directory</h1>
        <p className="text-muted-foreground">Discover the best AI tools, updated daily.</p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <Suspense>
          <div className="flex flex-col sm:flex-row gap-3">
            <ToolSearch />
            <ViewToggle />
          </div>
          <ToolFilters categories={categories} />
        </Suspense>
      </div>

      <ToolGrid tools={tools} view={view} />

      <Suspense>
        <Pagination page={page} hasMore={hasMore} />
      </Suspense>
    </div>
  )
}
