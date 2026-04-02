import { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedPosts } from '@/lib/supabase/queries/blog'
import { BlogCard } from '@/components/blog/BlogCard'
import { JsonLd } from '@/components/common/JsonLd'
import { SITE_URL } from '@/lib/constants/site'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'

export const metadata: Metadata = {
  title: 'AI Costs Guide 2026 | Reduce Your AI Spending',
  description: 'Complete guide to reducing AI tool spending. Learn how to audit subscriptions, detect overlap, and cut unnecessary costs.',
  alternates: { canonical: '/blog/ai-costs' },
}

export default async function AICostsClusterPage() {
  const [{ posts }] = await Promise.all([getPublishedPosts(1)])

  const costPosts = posts.filter((p) =>
    p.tags?.some((t) => ['ai-spending-2026', 'cost-saving-ai', 'ai-spend', 'subscriptions', 'cost-tracking', 'ai-tools-audit'].includes(t))
  )

  const relatedTopics = [
    { name: 'AI Productivity', slug: 'productivity', count: 6 },
    { name: 'Local AI', slug: 'local-ai', count: 2 },
    { name: 'LLM Comparison', slug: 'llm-comparison', count: 4 },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Costs Guide',
    description: 'Complete guide to reducing AI tool spending',
    url: `${SITE_URL}/blog/ai-costs`,
    hasPart: costPosts.map((p) => ({
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
        <div className="text-center py-12 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            Content Cluster
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">AI Costs Guide</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete guide to reducing AI tool spending. Learn how to audit subscriptions and cut unnecessary costs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {costPosts.slice(0, 6).map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

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

        <div className="glass-card rounded-2xl overflow-hidden border border-primary/15 mb-12">
          <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black leading-tight mb-1">Track your AI spending</h3>
              <p className="text-xs text-muted-foreground">See what you&apos;re paying for and cut the waste.</p>
            </div>
            <div className="sm:w-72 shrink-0">
              <NewsletterBanner source="costs-cluster" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}