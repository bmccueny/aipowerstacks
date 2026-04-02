import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getPublishedPosts } from '@/lib/supabase/queries/blog'
import { getAllCategories } from '@/lib/supabase/queries/categories'
import { BlogCard } from '@/components/blog/BlogCard'
import { JsonLd } from '@/components/common/JsonLd'
import { SITE_URL } from '@/lib/constants/site'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'

export const metadata: Metadata = {
  title: 'AI Productivity Guide 2026 | AIPowerStacks',
  description: 'Complete guide to AI tools that boost productivity. Learn how to automate workflows, reduce costs, and scale your business with AI-powered solutions.',
  alternates: { canonical: '/blog/productivity' },
}

export default async function ProductivityClusterPage() {
  const [{ posts }, categories] = await Promise.all([
    getPublishedPosts(1),
    getAllCategories(),
  ])

  const productivityPosts = posts.filter((p) =>
    p.tags?.some((t) => ['ai-productivity', 'productivity', 'business-productivity', 'ai-workflow', 'workflow-automation'].includes(t))
  )

  const relatedTopics = [
    { name: 'AI Agents', slug: 'ai-agents', count: 4 },
    { name: 'LLM Comparison', slug: 'llm-comparison', count: 4 },
    { name: 'Local AI', slug: 'local-ai', count: 2 },
    { name: 'AI Costs', slug: 'ai-costs', count: 2 },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Productivity Guide',
    description: 'Complete guide to AI tools that boost productivity',
    url: `${SITE_URL}/blog/productivity`,
    hasPart: productivityPosts.map((p) => ({
      '@type': 'Article',
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.published_at,
    })),
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="page-shell">
        {/* Hero */}
        <div className="text-center py-12 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            Content Cluster
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">AI Productivity Guide</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete guide to AI tools that boost productivity. Learn how to automate workflows, reduce costs, and scale your business.
          </p>
        </div>

        {/* Main posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {productivityPosts.slice(0, 6).map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {/* Related clusters */}
        <div className="glass-card rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-black mb-4">Explore Related Clusters</h2>
          <div className="flex flex-wrap gap-3">
            {relatedTopics.map((topic) => (
              <Link
                key={topic.slug}
                href={`/blog/${topic.slug}`}
                className="px-4 py-2 rounded-full glass-card text-sm font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {topic.name} ({topic.count} posts)
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="glass-card rounded-2xl overflow-hidden border border-primary/15 mb-12">
          <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black leading-tight mb-1">Track your AI spending</h3>
              <p className="text-xs text-muted-foreground">See what you&apos;re paying for and cut the waste.</p>
            </div>
            <div className="sm:w-72 shrink-0">
              <NewsletterBanner source="productivity-cluster" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}