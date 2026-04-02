import Link from 'next/link'
import { SITE_URL } from '@/lib/constants/site'
import { getPublishedPosts, getFeaturedPost, getBlogCategories } from '@/lib/supabase/queries/blog'
import { BLOG_PAGE_SIZE } from '@/lib/constants'
import { BlogCard } from '@/components/blog/BlogCard'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
import { Pagination } from '@/components/common/Pagination'
import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import { JsonLd } from '@/components/common/JsonLd'
import { generateBlogJsonLd } from '@/lib/utils/seo'

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const { page: pageStr, category } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))

  const [{ posts, total }, featured, categories] = await Promise.all([
    getPublishedPosts(page, category),
    page === 1 && !category ? getFeaturedPost() : Promise.resolve(null),
    getBlogCategories(),
  ])

  const totalPages = Math.ceil(total / BLOG_PAGE_SIZE)
  const regularPosts = featured ? posts.filter((p) => p.id !== featured.id) : posts

  const allPosts = featured ? [featured, ...regularPosts] : regularPosts
  const blogJsonLd = generateBlogJsonLd(allPosts)

  // Mixed grid: first 2 regular posts get "secondary" variant on page 1
  const secondaryPosts = page === 1 && !category ? regularPosts.slice(0, 2) : []
  const gridPosts = page === 1 && !category ? regularPosts.slice(2) : regularPosts

  return (
    <div className="page-shell">
      <JsonLd data={blogJsonLd} />
      <div className="text-center pt-4 pb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">AI news and briefings</h1>
        <p className="text-muted-foreground">What changed, why it matters, and what to do next.</p>
      </div>

      {/* Category navigation */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Link
            href="/blog"
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              !category
                ? 'bg-primary text-primary-foreground'
                : 'glass-card text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                category === cat.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'glass-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Featured hero — page 1 only */}
      {featured && page === 1 && !category && (
        <div className="mb-10">
          <BlogCard post={featured} featured />
        </div>
      )}

      {/* Secondary posts — 2-column for first 2 posts on page 1 */}
      {secondaryPosts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {secondaryPosts.map((post) => (
            <BlogCard key={post.id} post={post} variant="secondary" />
          ))}
        </div>
      )}

      {/* Remaining posts grid */}
      {gridPosts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {gridPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10">
          <Pagination page={page} hasMore={page < totalPages} />
        </div>
      )}

      <section className="mt-12">
        <div className="gum-card rounded-md p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Newsletter</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-2">The AI briefing your feed algorithm won't show you</h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
            Weekly updates on cutting-edge models, breakthrough tools, and what matters for builders and buyers.
          </p>
          <div className="max-w-xl">
            <NewsletterBanner source="blog-page" />
          </div>
        </div>
      </section>
    </div>
  )
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}): Promise<Metadata> {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))
  const title = 'AI News & Briefings'
  const description = 'Daily AI news and briefings for builders and buyers. Model releases, tool updates, funding rounds, and actionable insights on what changed, why it matters, and what to do next.'
  const canonical = page > 1 ? `/blog?page=${page}` : '/blog'

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonical}`,
      type: 'website',
      siteName: 'AIPowerStacks',
      images: [{ url: `${SITE_URL}/og-home-v2.jpg`, width: 1200, height: 630, alt: 'AIPowerStacks AI News & Briefings' }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@aipowerstacks',
      title,
      description,
      images: [`${SITE_URL}/og-home-v2.jpg`],
    },
  }
}
