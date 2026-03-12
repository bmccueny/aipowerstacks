import Image from 'next/image'
import { SITE_URL } from '@/lib/constants/site'
import { getPublishedPosts, getFeaturedPost } from '@/lib/supabase/queries/blog'
import { getLatestAINews } from '@/lib/supabase/queries/news'
import { BlogCard } from '@/components/blog/BlogCard'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
import { Pagination } from '@/components/common/Pagination'
import type { Metadata } from 'next'
import { ExternalLink, Sparkles } from 'lucide-react'

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))

  const [{ posts, total }, featured, latestNews] = await Promise.all([
    getPublishedPosts(page),
    page === 1 ? getFeaturedPost() : Promise.resolve(null),
    page === 1 ? getLatestAINews(24) : Promise.resolve([]),
  ])

  const totalPages = Math.ceil(total / 24)
  const regularPosts = featured ? posts.filter((p) => p.id !== featured.id) : posts

  return (
    <div className="page-shell">
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

      {page === 1 && latestNews.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold">Live AI News Wire</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {latestNews.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="override grid h-full overflow-hidden rounded-lg brutalist-card-effect burn-glow-card no-underline group"
              >
                <div className="h-full flex flex-col">
                  {item.image_url ? (
                    <div className="relative h-44 shrink-0 overflow-hidden">
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-primary/8 to-amber-100 flex items-center justify-center shrink-0">
                      <span className="text-5xl opacity-20">✦</span>
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider truncate">
                        {item.source_name}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    </div>
                    <h3 className="font-semibold text-[17px] mb-3 transition-colors line-clamp-3 flex-1 leading-[1.3] group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <div className="text-[14px] font-reddit font-semibold text-muted-foreground border-t border-foreground/10 pt-3 mt-auto">
                      {new Date(item.published_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
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
          <h2 className="text-2xl sm:text-3xl font-black mb-2">Get the next briefing in your inbox.</h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
            Weekly signal on model launches, product shifts, and practical moves for teams shipping with AI.
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
  const description = 'Daily AI news and briefings for builders: what changed, why it matters, and what to do next.'
  const canonical = page > 1 ? `/blog?page=${page}` : '/blog'

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonical}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
