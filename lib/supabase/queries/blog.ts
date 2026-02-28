import { createClient } from '@/lib/supabase/server'
import { PAGE_SIZE } from '@/lib/constants'

export async function getPublishedPosts(page = 1, category?: string) {
  const supabase = await createClient()
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, tags, reading_time_min, published_at, view_count, author_id', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (category) {
    const { data: cat } = await supabase.from('blog_categories').select('id').eq('slug', category).single()
    const catData = cat as { id: string } | null
    if (catData?.id) query = query.eq('category_id', catData.id)
  }

  const { data, count } = await query
  return { posts: (data ?? []) as BlogPostSummary[], total: count ?? 0 }
}

export async function getBlogPostBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!data) return null
  return data as BlogPostFull
}

export async function getBlogCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('blog_categories').select('id, name, slug').order('name')
  return (data ?? []) as { id: string; name: string; slug: string }[]
}

export async function getFeaturedPost() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, tags, reading_time_min, published_at')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()
  return (data ?? null) as BlogPostSummary | null
}

export type BlogPostSummary = {
  id: string
  title: string
  slug: string
  excerpt: string
  cover_image_url: string | null
  tags: string[]
  reading_time_min: number | null
  published_at: string | null
  view_count: number
  author_id: string
}

export type BlogPostFull = BlogPostSummary & {
  content: string
  is_featured: boolean
  video_embed_url: string | null
  created_at: string
  updated_at: string
}

export async function getLatestBriefings(limit = 3): Promise<BlogPostSummary[]> {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('blog_categories')
    .select('id')
    .in('slug', ['daily-ai-briefing', 'ai-briefing', 'ai-briefings'])

  const categoryIds = (categories ?? []).map((cat) => cat.id).filter(Boolean)
  if (!categoryIds.length) return []

  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, tags, reading_time_min, published_at')
    .eq('status', 'published')
    .in('category_id', categoryIds)
    .order('published_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as BlogPostSummary[]
}
