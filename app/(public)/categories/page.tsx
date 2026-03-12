import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/constants/site'
import { getAllCategories } from '@/lib/supabase/queries/categories'
import { Sparkles } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { JsonLd } from '@/components/common/JsonLd'
import { generateItemListJsonLd } from '@/lib/utils/seo'

export const metadata: Metadata = {
  title: 'AI Tool Categories',
  description: 'Browse AI tool categories and discover the best tools for each workflow.',
  alternates: {
    canonical: '/categories',
  },
  openGraph: {
    title: 'AI Tool Categories',
    description: 'Browse AI tool categories and discover the best tools for each workflow.',
    url: `${SITE_URL}/categories`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Tool Categories',
    description: 'Browse AI tool categories and discover the best tools for each workflow.',
  },
}

export default async function CategoriesPage() {
  const categories = await getAllCategories()

  const featured = categories.filter((c) => c.sort_order > 0).slice(0, 38)

  const categoriesJsonLd = generateItemListJsonLd(
    featured.map((c) => ({ name: c.name, url: `/categories/${c.slug}` })),
    'AI Tool Categories',
    '/categories',
  )

  return (
    <div className="page-shell">
      <JsonLd data={categoriesJsonLd} />
      <div className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Browse By Workflow
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">AI Tool Categories</h1>
        <p className="text-muted-foreground">Explore {categories.length} categories to shortlist tools faster by job-to-be-done.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {featured.map((cat, idx) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="category-card rounded-md p-3 flex flex-col items-center justify-center gap-2 group text-center min-h-[100px] animate-in-stagger"
            style={{
              animationDelay: `${idx * 0.03}s`,
            }}
          >
            <CategoryIcon slug={cat.slug} emoji={cat.icon} />
            <div>
              <p className="text-[13px] font-medium transition-colors leading-[1.35]">{cat.name}</p>
              {cat.tool_count > 0 && (                <p className="text-[12px] text-muted-foreground mt-0.5">{cat.tool_count} tools</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
