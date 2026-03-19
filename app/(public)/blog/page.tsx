import { SITE_URL } from '@/lib/constants/site'
import { getPublishedPosts, getFeaturedPost } from '@/lib/supabase/queries/blog'
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
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))

  const [{ posts, total }, featured] = await Promise.all([
    getPublishedPosts(page),
    page === 1 ? getFeaturedPost() : Promise.resolve(null),
  ])

  const totalPages = Math.ceil(total / BLOG_PAGE_SIZE)
  const regularPosts = featured ? posts.filter((p) => p.id !== featured.id) : posts

  const allPosts = featured ? [featured, ...regularPosts] : regularPosts
  const blogJsonLd = generateBlogJsonLd(allPosts)

  return (
    <div className="page-shell">
      <JsonLd data={blogJsonLd} />
      <div className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          AI Briefing
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">AI News &amp; Briefings For Builders</h1>
        <p className="text-muted-foreground">What changed, why it matters, and what to do next.</p>
      </div>

      {featured && page === 1 && (
        <div className="mb-10">
          <BlogCard post={featured} featured />
        </div>
      )}

      {regularPosts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {regularPosts.map((post) => (
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
  searchParams: Promise<{ page?: string }>
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
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'AIPowerStacks AI News & Briefings' }],
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
