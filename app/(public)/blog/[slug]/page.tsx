import Link from 'next/link'
import Image from 'next/image'
import sanitizeHtml from 'sanitize-html'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'
import { getBlogPostBySlug, getPublishedPosts } from '@/lib/supabase/queries/blog'
import { JsonLd } from '@/components/common/JsonLd'
import { BlogCard } from '@/components/blog/BlogCard'
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
import { FacebookIcon, LinkedInIcon, XIcon } from '@/components/common/SocialIcons'
import { SITE_URL } from '@/lib/constants/site'

function normalizeThumUrl(url: string | null): string | null {
  if (!url) return null
  let normalizedUrl = url.replace(/^http:\/\//, 'https://')
  if (normalizedUrl.startsWith('https://image.thum.io/get/')) {
    const marker = '/noanimate/'
    const markerIndex = normalizedUrl.indexOf(marker)
    if (markerIndex !== -1) {
      try {
        const parsed = new URL(normalizedUrl)
        const articlePartRaw = parsed.pathname.slice(markerIndex + marker.length).replace(/^\/+/, '')
        if (articlePartRaw) {
          const decoded = decodeURIComponent(articlePartRaw)
          const articleUrl = encodeURIComponent(decoded) + (parsed.search || '')
          normalizedUrl = `${normalizedUrl.slice(0, markerIndex + marker.length)}${articleUrl}`
        }
      } catch {
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

export const revalidate = 3600

export async function generateStaticParams() {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(200)
  return (data ?? []).map((p) => ({ slug: p.slug }))
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

  // Content is sanitized before rendering — safe to use with dangerouslySetInnerHTML
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
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
    author: { '@type': 'Person', name: post.author?.display_name || 'AIPowerStacks Team' },
    publisher: { '@type': 'Organization', name: 'AIPowerStacks', logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <article className="page-shell max-w-4xl mx-auto">
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to all posts
        </Link>

        {/* Cover image — full bleed above the card */}
        {coverImageUrl && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-8">
            <Image src={coverImageUrl} alt={post.title} fill unoptimized className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        )}

        {/* Main article card */}
        <div className="glass-card rounded-2xl overflow-hidden mb-12">
          {/* Header */}
          <div className="p-8 sm:p-10 pb-0">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {post.tags?.[0] && (
                <span className="gum-pill px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  {post.tags[0]}
                </span>
              )}
              {date && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {date}
                </span>
              )}
              {post.reading_time_min && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {post.reading_time_min} min read
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black mb-6 leading-[1.1] tracking-tight">
              {post.title}
            </h1>

            {/* Author row */}
            <div className="flex items-center justify-between gap-4 pb-8 border-b border-border/40">
              {post.author?.username ? (
                <Link href={`/curators/${post.author.username}`} className="flex items-center gap-3 group/author">
                  <div className="h-10 w-10 rounded-full bg-primary/10 border border-border/30 flex items-center justify-center font-black overflow-hidden relative">
                    {post.author?.avatar_url ? (
                      <Image src={post.author.avatar_url} alt={post.author.display_name ?? ''} fill className="object-cover" />
                    ) : (
                      <span className="text-sm text-primary">{(post.author?.display_name?.[0] ?? 'A').toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-none group-hover/author:text-primary transition-colors">
                      {post.author?.display_name || 'AIPowerStacks Team'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">@{post.author.username}</p>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 border border-border/30 flex items-center justify-center font-black overflow-hidden relative">
                    <span className="text-sm text-primary">{(post.author?.display_name?.[0] ?? 'A').toUpperCase()}</span>
                  </div>
                  <p className="text-sm font-bold">{post.author?.display_name || 'AIPowerStacks Team'}</p>
                </div>
              )}

              {/* Share buttons — desktop */}
              <div className="hidden sm:flex items-center gap-2">
                <a href={shareLinks.x} target="_blank" rel="noopener noreferrer" className="h-9 w-9 flex items-center justify-center rounded-full glass-card border border-border/30 text-muted-foreground hover:text-foreground hover:border-border transition-all hover:-translate-y-0.5">
                  <XIcon className="h-3.5 w-3.5" />
                </a>
                <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="h-9 w-9 flex items-center justify-center rounded-full glass-card border border-border/30 text-muted-foreground hover:text-foreground hover:border-border transition-all hover:-translate-y-0.5">
                  <LinkedInIcon className="h-3.5 w-3.5" />
                </a>
                <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="h-9 w-9 flex items-center justify-center rounded-full glass-card border border-border/30 text-muted-foreground hover:text-foreground hover:border-border transition-all hover:-translate-y-0.5">
                  <FacebookIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-10">
            {/* Excerpt callout */}
            {post.excerpt && (
              <div className="mb-10 p-5 glass-card rounded-xl border border-primary/15 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-full" />
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2 pl-3">TL;DR</p>
                <p className="text-base font-medium leading-relaxed text-foreground/80 pl-3 italic">&quot;{post.excerpt}&quot;</p>
              </div>
            )}

            {/* Video embed */}
            {post.video_embed_url && (
              <div className="aspect-video mb-10 rounded-xl overflow-hidden glass-card border border-border/30">
                {post.video_embed_url.endsWith('.mp4') || post.video_embed_url.endsWith('.webm') ? (
                  <video src={post.video_embed_url} className="w-full h-full object-cover" controls playsInline preload="metadata" title={post.title} />
                ) : (
                  <iframe src={post.video_embed_url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen title={post.title} />
                )}
              </div>
            )}

            {/* Article body — content is sanitized via sanitize-html above */}
            <div
              className="prose prose-base sm:prose-lg max-w-none
                prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground
                prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-14 prose-h2:mb-5 prose-h2:pb-3 prose-h2:border-b prose-h2:border-border/30
                prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4
                prose-p:leading-relaxed prose-p:text-foreground/80
                prose-li:text-foreground/80 prose-li:leading-relaxed
                prose-blockquote:border-l-2 prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:p-5 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-foreground/70
                prose-a:text-primary prose-a:font-semibold prose-a:underline prose-a:decoration-primary/30 prose-a:underline-offset-4 hover:prose-a:decoration-primary/60 prose-a:transition-colors
                prose-img:rounded-xl prose-img:border prose-img:border-border/20
                prose-strong:text-foreground prose-strong:font-bold
                prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
                dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-white/75 dark:prose-h2:border-white/10"
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />

            {/* Tags & Mobile share */}
            <div className="mt-14 pt-8 border-t border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex flex-wrap gap-2">
                {post.tags?.map((tag) => (
                  <span key={tag} className="gum-pill px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex sm:hidden items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Share</span>
                <a href={shareLinks.x} target="_blank" rel="noopener noreferrer" className="h-9 w-9 flex items-center justify-center rounded-full glass-card border border-border/30 text-muted-foreground hover:text-foreground transition-all"><XIcon className="h-3.5 w-3.5" /></a>
                <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="h-9 w-9 flex items-center justify-center rounded-full glass-card border border-border/30 text-muted-foreground hover:text-foreground transition-all"><LinkedInIcon className="h-3.5 w-3.5" /></a>
                <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="h-9 w-9 flex items-center justify-center rounded-full glass-card border border-border/30 text-muted-foreground hover:text-foreground transition-all"><FacebookIcon className="h-3.5 w-3.5" /></a>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="glass-card rounded-2xl overflow-hidden mb-12 border border-primary/15">
          <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black leading-tight mb-1">
                Stay ahead of the AI curve
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Weekly briefings on models, tools, and what matters.
              </p>
            </div>
            <div className="sm:w-72 shrink-0">
              <NewsletterBanner source="blog-post" />
            </div>
          </div>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xl font-black mb-6 tracking-tight">More from AI Briefing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
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
