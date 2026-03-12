import { createAdminClient } from '@/lib/supabase/admin'
import { BlogPostForm } from '@/components/blog/BlogPostForm'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Post — AIPowerStacks Admin' }

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content, cover_image_url, tags, status, is_featured, video_embed_url, reading_time_min')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const post = data as {
    id: string; title: string; slug: string; excerpt: string; content: string
    cover_image_url: string | null; tags: string[]; status: string
    is_featured: boolean; video_embed_url: string | null; reading_time_min: number | null
  }

  return <BlogPostForm post={post} />
}
