import Link from 'next/link'
import Image from 'next/image'
import sanitizeHtml from 'sanitize-html'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Calendar, Clock } from 'lucide-react'
import { getBlogPostBySlug, getPublishedPosts } from '@/lib/supabase/queries/blog'
import { JsonLd } from '@/components/common/JsonLd'
import { BlogCard } from '@/components/blog/BlogCard'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
import { FacebookIcon, LinkedInIcon, XIcon } from '@/components/common/SocialIcons'
import { SITE_URL } from '@/lib/constants/site'

function normalizeThumUrl(url: string | null): string | null {
  if (!url) return null

  // Ensure HTTPS
  let normalizedUrl = url.replace(/^http:\/\//, 'https://')

  // Handle Thum.io URLs
  if (normalizedUrl.startsWith('https://image.thum.io/get/')) {
    const marker = '/noanimate/'
    const markerIndex = normalizedUrl.indexOf(marker)
    if (markerIndex !== -1) {
      try {
        const parsed = new URL(normalizedUrl)
        const articlePartRaw = parsed.pathname.slice(markerIndex + marker.length).replace(/^\/+/, '')
        if (articlePartRaw) {
          // Decode once to handle any existing encoding
          const decoded = decodeURIComponent(articlePartRaw)
          // Re-encode properly
          const articleUrl = encodeURIComponent(decoded) + (parsed.search || '')
          normalizedUrl = `${normalizedUrl.slice(0, markerIndex + marker.length)}${articleUrl}`
        }
      } catch (error) {
        console.error('Error normalizing Thum.io URL:', error, url)
        // Return original URL if parsing fails
      }
    }
  }

  return normalizedUrl
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  const { posts } = await getPublishedPosts(1)
  const relatedPosts = posts.filter((candidate) => candidate.slug !== post.slug).slice(0, 3)
  const coverImageUrl = normalizeThumUrl(post.cover_image_url)
  const postUrl = `${SITE_URL}/blog/${post.slug}`
  const encodedPostUrl = encodeURIComponent(postUrl)
  const encodedTitle = encodeURIComponent(post.title)
  const shareLinks = {
    x: `https://x.com/intent/tweet?url=${encodedPostUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedPostUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedPostUrl}`,
  }

  const safeContent = sanitizeHtml(post.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'figcaption', 'video', 'source', 'picture']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class', 'id', 'style'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'title', 'frameborder'],
      a: ['href', 'target', 'rel'],
      source: ['src', 'type'],
      video: ['src', 'controls', 'width', 'height'],
    },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'player.vimeo.com', 'www.loom.com'],
  })
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: coverImageUrl,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    url: `${SITE_URL}/blog/${post.slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    author: {
      '@type': 'Person',
      name: post.author?.display_name || 'AIPowerStacks Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AIPowerStacks',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <article className="page-shell max-w-4xl mx-auto">
        <div className="bg-background border-2 border-foreground dark:border-white rounded-3xl overflow-hidden shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary)] sm:dark:shadow-[8px_8px_0_0_var(--primary)] mb-12">
          {/* Header Section */}
          <div className="p-8 sm:p-12 border-b-2 border-foreground dark:border-white">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {post.tags?.[0] && (
                <span className="px-3 py-1 bg-primary text-black text-xs font-black uppercase tracking-wider rounded-full border-2 border-black">
                  {post.tags[0]}
                </span>
              )}
              {date && (
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {date}
                </span>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
              {post.title}
            </h1>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border-2 border-black bg-primary/20 flex items-center justify-center font-black overflow-hidden relative">
                  {post.author?.avatar_url ? (
                    <Image src={post.author.avatar_url} alt={post.author.display_name ?? ''} fill className="object-cover" />
                  ) : (
                    <span className="text-sm">{(post.author?.display_name?.[0] ?? 'A').toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-black leading-none">
                    {post.author?.display_name || 'AIPowerStacks Team'}
                    {post.author?.username && (
                      <span className="text-muted-foreground ml-2 font-bold">@{post.author.username}</span>
                    )}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                    {post.reading_time_min ? `${post.reading_time_min} min read` : 'Briefing'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {coverImageUrl && (
            <div className="relative aspect-[21/9] border-b-2 border-foreground dark:border-white bg-muted">
              <Image src={coverImageUrl} alt={post.title} fill unoptimized className="object-cover" />
            </div>
          )}

          {/* Content Section */}
          <div className="p-8 sm:p-12">
            {post.excerpt && (
              <div className="mb-12 p-6 bg-primary/5 border-2 border-black dark:border-white rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-3">The Short Version</p>
                <p className="text-lg font-bold leading-relaxed italic">&quot;{post.excerpt}&quot;</p>
              </div>
            )}

            {post.video_embed_url && (
              <div className="aspect-video mb-12 rounded-2xl overflow-hidden border-2 border-black shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary)]">
                <iframe
                  src={post.video_embed_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={post.title}
                />
              </div>
            )}

            <div
              className="prose prose-base sm:prose-lg max-w-none 
                prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground
                prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:pb-4 prose-h2:border-b-2 prose-h2:border-black/10
                prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4
                prose-p:leading-relaxed prose-p:text-foreground/80
                prose-li:text-foreground/80 prose-li:leading-relaxed
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:p-6 prose-blockquote:rounded-r-xl prose-blockquote:italic
                prose-a:text-primary prose-a:font-black prose-a:underline decoration-2 underline-offset-4 hover:bg-primary/10 transition-colors
                prose-img:rounded-2xl prose-img:border-2 prose-img:border-black/10 prose-img:shadow-xl
                dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-white/80 dark:prose-h2:border-white/10"
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />

            {/* Tags & Sharing */}
            <div className="mt-16 pt-10 border-t-2 border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
              <div className="flex flex-wrap gap-2">
                {post.tags?.map((tag) => (
                  <span key={tag} className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-background border-2 border-black hover:bg-primary hover:text-black transition-colors cursor-default">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Share Post</span>
                <div className="flex gap-2">
                  <a href={shareLinks.x} target="_blank" rel="noopener noreferrer" className="h-11 w-11 flex items-center justify-center rounded-full border-2 border-black hover:bg-primary transition-all hover:-translate-y-1 active:translate-y-0">
                    <XIcon className="h-4 w-4" />
                  </a>
                  <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="h-11 w-11 flex items-center justify-center rounded-full border-2 border-black hover:bg-primary transition-all hover:-translate-y-1 active:translate-y-0">
                    <LinkedInIcon className="h-4 w-4" />
                  </a>
                  <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="h-11 w-11 flex items-center justify-center rounded-full border-2 border-black hover:bg-primary transition-all hover:-translate-y-1 active:translate-y-0">
                    <FacebookIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter Footer */}
          <div className="bg-foreground text-background dark:bg-primary dark:text-black p-8 sm:p-12">
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl font-black mb-4 leading-tight">
                The AI briefing your feed algorithm won't show you
              </h3>
              <p className="text-sm sm:text-lg mb-8 opacity-90 font-medium">
                Weekly updates on cutting-edge models, breakthrough tools, and what matters for builders and buyers.
              </p>
              <div className="newsletter-invert">
                <NewsletterBanner source="blog-post" />
              </div>
              <Link href="/blog" className="inline-block mt-8 text-xs font-black uppercase tracking-widest border-b-2 border-current hover:opacity-70 transition-opacity">
                ← Back to all briefings
              </Link>
            </div>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <section className="mb-20">
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">More from AI Briefing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <BlogCard key={related.id} post={related} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}
