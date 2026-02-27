import { getBlogPostBySlug } from '@/lib/supabase/queries/blog'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { JsonLd } from '@/components/common/JsonLd'
import { Calendar, Clock } from 'lucide-react'
import Image from 'next/image'
import DOMPurify from 'isomorphic-dompurify'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: post.cover_image_url ? [post.cover_image_url] : [] },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  const safeContent = DOMPurify.sanitize(post.content)
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image_url,
    datePublished: post.published_at,
    dateModified: post.updated_at,
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <article className="max-w-3xl mx-auto px-4 py-12">
        {post.tags?.[0] && (
          <span className="text-xs font-semibold text-primary uppercase tracking-wide mb-4 block">{post.tags[0]}</span>
        )}
        <h1 className="text-4xl font-bold mb-4 leading-tight">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          {date && <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{date}</span>}
          {post.reading_time_min && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{post.reading_time_min} min read</span>}
        </div>

        {post.cover_image_url && (
          <div className="relative h-72 sm:h-96 rounded-xl overflow-hidden mb-8">
            <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" />
          </div>
        )}

        {post.video_embed_url && (
          <div className="aspect-video mb-8 rounded-xl overflow-hidden">
            <iframe src={post.video_embed_url} className="w-full h-full" allowFullScreen title={post.title} />
          </div>
        )}

        <div
          className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-white/10">
            {post.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </>
  )
}
