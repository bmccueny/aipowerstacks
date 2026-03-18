import { createClient } from '@/lib/supabase/server'
import { BLOG_PAGE_SIZE } from '@/lib/constants'

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
  author: {
    display_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

export type BlogPostFull = BlogPostSummary & {
  content: string
  is_featured: boolean
  video_embed_url: string | null
  created_at: string
  updated_at: string
}

export async function getPublishedPosts(page = 1, category?: string) {
  const supabase = await createClient()
  const offset = (page - 1) * BLOG_PAGE_SIZE

  let query = supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, tags, reading_time_min, published_at, view_count, author_id', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + BLOG_PAGE_SIZE - 1)

  if (category) {
    const { data: cat } = await supabase.from('blog_categories').select('id').eq('slug', category).single()
    const catData = cat as { id: string } | null
    if (catData?.id) query = query.eq('category_id', catData.id)
  }

  const { data, count } = await query
  const posts = (data ?? []).map(p => ({ ...p, author: null })) as (BlogPostSummary)[]

  // Fetch authors separately to avoid join issues
  const authorIds = Array.from(new Set(posts.map(p => p.author_id).filter(Boolean)))
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', authorIds)
    
    if (authors) {
      const authorMap = new Map(authors.map(a => [a.id, a]))
      posts.forEach(p => {
        p.author = authorMap.get(p.author_id) || null
      })
    }
  }

  return { posts, total: count ?? 0 }
}

export async function getBlogPostBySlug(slug: string) {
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) return null

  // Fetch author
  const { data: author } = await supabase
    .from('profiles')
    .select('display_name, username, avatar_url')
    .eq('id', post.author_id)
    .single()

  return { ...post, author: author || null } as BlogPostFull
}

export async function getBlogCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('blog_categories').select('id, name, slug').order('name')
  return (data ?? []) as { id: string; name: string; slug: string }[]
}

export async function getFeaturedPost() {
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, tags, reading_time_min, published_at, author_id')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()
  
  if (!post) return null

  // Fetch author
  const { data: author } = await supabase
    .from('profiles')
    .select('display_name, username, avatar_url')
    .eq('id', (post as any).author_id)
    .single()

  return { ...post, author: author || null } as BlogPostSummary
}

export async function getLatestPosts(limit = 3): Promise<BlogPostSummary[]> {
  const supabase = await createClient()

  const { data: dataRaw } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, tags, reading_time_min, published_at, author_id')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (!dataRaw) return []
  const posts = dataRaw.map(p => ({ ...p, author: null })) as BlogPostSummary[]

  const authorIds = Array.from(new Set(posts.map(p => p.author_id).filter(Boolean)))
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', authorIds)

    if (authors) {
      const authorMap = new Map(authors.map(a => [a.id, a]))
      posts.forEach(p => {
        p.author = authorMap.get(p.author_id) || null
      })
    }
  }

  return posts
}

export async function getLatestBriefings(limit = 3): Promise<BlogPostSummary[]> {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('blog_categories')
    .select('id')
    .in('slug', ['daily-ai-briefing', 'ai-briefing', 'ai-briefings'])

  const categoryIds = (categories ?? []).map((cat) => cat.id).filter(Boolean)
  if (!categoryIds.length) return []

  const { data: dataRaw } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, tags, reading_time_min, published_at, author_id')
    .eq('status', 'published')
    .in('category_id', categoryIds)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (!dataRaw) return []
  const posts = dataRaw.map(p => ({ ...p, author: null })) as BlogPostSummary[]

  // Fetch authors separately
  const authorIds = Array.from(new Set(posts.map(p => p.author_id).filter(Boolean)))
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', authorIds)
    
    if (authors) {
      const authorMap = new Map(authors.map(a => [a.id, a]))
      posts.forEach(p => {
        p.author = authorMap.get(p.author_id) || null
      })
    }
  }

  return posts
}
