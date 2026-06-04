import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getBlogCategories, getPublishedPosts } from '@/lib/supabase/queries/blog'
import { BlogCard } from '@/components/blog/BlogCard'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { Pagination } from '@/components/common/Pagination'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
import { SITE_URL } from '@/lib/constants/site'
import { BLOG_PAGE_SIZE } from '@/lib/constants'
import { Suspense } from 'react'
import { Sparkles } from 'lucide-react'

export async function generateStaticParams() {
  const categories = await getBlogCategories()
  return categories.map((cat) => ({ category: cat.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const categories = await getBlogCategories()
  const cat = categories.find((c) => c.slug === category)
  if (!cat) return { title: 'Category Not Found' }

  const title = `${cat.name} Articles`
  const description = `Read the latest articles about ${cat.name.toLowerCase()} on the AIPowerStacks blog.`
  const canonical = `/blog/${category}`

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
      images: [{ url: `${SITE_URL}/og-home-v2.jpg`, width: 1200, height: 630, alt: `${cat.name} — AIPowerStacks Blog` }],
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

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const [{ category }, { page: pageStr }, categories] = await Promise.all([
    params,
    searchParams,
    getBlogCategories(),
  ])

  const cat = categories.find((c) => c.slug === category)
  if (!cat) notFound()

  const page = Math.max(1, parseInt(pageStr ?? '1'))
  const { posts, total } = await getPublishedPosts(page, category)
  const totalPages = Math.ceil(total / BLOG_PAGE_SIZE)

  return (
    <div className="page-shell">
      <Breadcrumbs
        items={[
          { label: 'Blog', href: '/blog' },
          { label: cat.name },
        ]}
      />

      <div className="text-center pt-2 pb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{cat.name}</h1>
        <p className="text-muted-foreground">
          The latest articles about {cat.name.toLowerCase()} from AIPowerStacks.
        </p>
      </div>

      {/* Category navigation */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Link
            href="/blog"
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors glass-card text-muted-foreground hover:text-foreground"
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/blog/${c.slug}`}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                c.slug === category
                  ? 'bg-primary text-primary-foreground'
                  : 'glass-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">No articles in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10">
          <Suspense fallback={<div className="h-10 w-64 animate-pulse rounded-lg bg-muted/40 mx-auto" />}>
            <Pagination page={page} hasMore={page < totalPages} />
          </Suspense>
        </div>
      )}

      <section className="mt-12">
        <div className="gum-card rounded-md p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Newsletter</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">The AI briefing your feed algorithm won't show you</h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
            Weekly updates on cutting-edge models, breakthrough tools, and what matters for builders and buyers.
          </p>
          <div className="max-w-xl">
            <NewsletterBanner source="blog-category-page" />
          </div>
        </div>
      </section>
    </div>
  )
}
