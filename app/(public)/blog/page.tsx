import { getPublishedPosts, getFeaturedPost } from '@/lib/supabase/queries/blog'
import { BlogCard } from '@/components/blog/BlogCard'
import { Pagination } from '@/components/common/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI News & Blog',
  description: 'Latest AI news, guides, and insights from the world of artificial intelligence tools.',
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))

  const [{ posts, total }, featured] = await Promise.all([
    getPublishedPosts(page),
    page === 1 ? getFeaturedPost() : Promise.resolve(null),
  ])

  const totalPages = Math.ceil(total / 24)
  const regularPosts = featured ? posts.filter((p) => p.id !== featured.id) : posts

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">AI News & Blog</h1>
      <p className="text-muted-foreground mb-8">Latest AI news, guides, and insights.</p>

      {featured && page === 1 && (
        <div className="mb-10">
          <BlogCard post={featured} featured />
        </div>
      )}

      {regularPosts.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
          No posts published yet. Check back soon!
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {regularPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-10">
          <Pagination page={page} hasMore={page < totalPages} />
        </div>
      )}
    </div>
  )
}
