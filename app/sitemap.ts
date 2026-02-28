import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants/site'

const BASE_URL = SITE_URL

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const [toolsRes, categoriesRes, postsRes] = await Promise.all([
    supabase.from('tools').select('slug, updated_at').eq('status', 'published').limit(5000),
    supabase.from('categories').select('slug, created_at'),
    supabase.from('blog_posts').select('slug, updated_at').eq('status', 'published').limit(1000),
  ])

  const tools = (toolsRes.data ?? []) as { slug: string; updated_at: string }[]
  const categories = (categoriesRes.data ?? []) as { slug: string; created_at: string }[]
  const posts = (postsRes.data ?? []) as { slug: string; updated_at: string }[]

  const toolUrls: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${BASE_URL}/tools/${t.slug}`,
    lastModified: t.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    lastModified: c.created_at,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const blogUrls: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${BASE_URL}/tools`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${BASE_URL}/submit`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    ...toolUrls,
    ...categoryUrls,
    ...blogUrls,
  ]
}
