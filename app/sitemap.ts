import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SITE_URL } from '@/lib/constants/site'

const BASE_URL = SITE_URL

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const [toolsRes, categoriesRes, postsRes, stacksRes, curatorsRes, vsToolsRes] = await Promise.all([
    supabase.from('tools').select('slug, updated_at').eq('status', 'published').limit(5000),
    supabase.from('categories').select('slug, created_at'),
    supabase.from('blog_posts').select('slug, updated_at').eq('status', 'published').limit(1000),
    supabase.from('collections').select('share_slug, updated_at').eq('is_public', true).limit(2000),
    supabase.from('profiles').select('username, created_at').not('username', 'is', null).limit(2000),
    adminSupabase
      .from('tools')
      .select('slug, category_id, updated_at')
      .eq('status', 'published')
      .gt('review_count', 0)
      .order('review_count', { ascending: false })
      .limit(40),
  ])

  const tools = (toolsRes.data ?? []) as { slug: string; updated_at: string }[]
  const categories = (categoriesRes.data ?? []) as { slug: string; created_at: string }[]
  const posts = (postsRes.data ?? []) as { slug: string; updated_at: string }[]
  const stacks = (stacksRes.data ?? []) as { share_slug: string; updated_at: string }[]
  const curators = (curatorsRes.data ?? []) as { username: string; created_at: string }[]

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
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const stackUrls: MetadataRoute.Sitemap = stacks.map((s) => ({
    url: `${BASE_URL}/stacks/${s.share_slug}`,
    lastModified: s.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  // Generate vs comparison pairs from top tools grouped by category
  const vsTools = (vsToolsRes.data ?? []) as { slug: string; category_id: string; updated_at: string }[]
  const vsByCategory = new Map<string, typeof vsTools>()
  for (const t of vsTools) {
    if (!t.category_id) continue
    if (!vsByCategory.has(t.category_id)) vsByCategory.set(t.category_id, [])
    vsByCategory.get(t.category_id)!.push(t)
  }
  const vsUrls: MetadataRoute.Sitemap = []
  for (const [, catTools] of vsByCategory) {
    for (let i = 0; i < catTools.length && vsUrls.length < 50; i++) {
      for (let j = i + 1; j < catTools.length && vsUrls.length < 50; j++) {
        vsUrls.push({
          url: `${BASE_URL}/compare/${catTools[i].slug}-vs-${catTools[j].slug}`,
          lastModified: new Date(Math.max(
            new Date(catTools[i].updated_at).getTime(),
            new Date(catTools[j].updated_at).getTime(),
          )),
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        })
      }
    }
  }

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${BASE_URL}/tools`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${BASE_URL}/stacks`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${BASE_URL}/compare`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${BASE_URL}/submit`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${BASE_URL}/matchmaker`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/blueprints`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/advertise`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${BASE_URL}/stacks/challenges`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.4 },
    { url: `${BASE_URL}/stacks/compare`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${BASE_URL}/compare/versus`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.5 },
    ...toolUrls,
    ...categoryUrls,
    ...blogUrls,
    ...stackUrls,
    ...curators.map((c) => ({
      url: `${BASE_URL}/curators/${c.username}`,
      lastModified: c.created_at,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
    ...vsUrls,
  ]
}
