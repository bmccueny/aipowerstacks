import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllCategories } from '@/lib/supabase/queries/categories'

export const metadata: Metadata = {
  title: 'AI Tool Categories',
  description: 'Browse 50+ AI tool categories — find the best AI tools for every task.',
}

export default async function CategoriesPage() {
  const categories = await getAllCategories()

  const featured = categories.filter((c) => c.sort_order > 0).slice(0, 38)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Tool Categories</h1>
        <p className="text-muted-foreground">Browse {categories.length}+ categories to find the perfect AI tool.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {featured.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="glass-card rounded-xl p-4 flex flex-col items-center gap-3 hover:border-primary/40 transition-colors group text-center"
          >
            <span className="text-3xl">{cat.icon ?? '🤖'}</span>
            <div>
              <p className="text-sm font-medium group-hover:text-primary transition-colors">{cat.name}</p>
              {cat.tool_count > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">{cat.tool_count} tools</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
