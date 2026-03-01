import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getCategoryBySlug } from '@/lib/supabase/queries/categories'
import { getToolsByCategory } from '@/lib/supabase/queries/tools'
import { ToolGrid } from '@/components/tools/ToolGrid'
import { Pagination } from '@/components/common/Pagination'
import { PAGE_SIZE } from '@/lib/constants'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  return {
    title: `Best ${category.name} AI Tools`,
    description: category.description ?? `Discover the best ${category.name} AI tools. Browse and compare ${category.tool_count}+ tools.`,
    alternates: {
      canonical: `/categories/${category.slug}`,
    },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageStr } = await searchParams
  const page = Number(pageStr ?? 1)

  const [category, { tools }] = await Promise.all([
    getCategoryBySlug(slug),
    getToolsByCategory(slug, page),
  ])

  if (!category) notFound()

  const hasMore = tools.length === PAGE_SIZE

  return (
    <div className="page-shell">
      <div className="page-hero flex flex-col items-start sm:flex-row sm:items-center gap-4">
        <span className="text-5xl">{category.icon ?? '🤖'}</span>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-1">{category.description}</p>
          )}
          {category.tool_count > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{category.tool_count} tools</p>
          )}
        </div>
      </div>

      <ToolGrid tools={tools} cardStyle="home" />

      <Suspense>
        <Pagination page={page} hasMore={hasMore} />
      </Suspense>
    </div>
  )
}
