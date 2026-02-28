import Link from 'next/link'
import Image from 'next/image'
import DOMPurify from 'isomorphic-dompurify'
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
  if (!url.startsWith('https://image.thum.io/get/')) return url

  const marker = '/noanimate/'
  const markerIndex = url.indexOf(marker)
  if (markerIndex === -1) return url

  try {
    const parsed = new URL(url)
    const articlePartRaw = parsed.pathname.slice(markerIndex + marker.length).replace(/^\/+/, '')
    if (!articlePartRaw) return url

    const articleUrl = decodeURIComponent(articlePartRaw) + (parsed.search || '')
    return `${url.slice(0, markerIndex + marker.length)}${encodeURIComponent(articleUrl)}`
  } catch {
    return url
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return {}
  const coverImageUrl = normalizeThumUrl(post.cover_image_url)
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${post.slug}`,
      images: coverImageUrl ? [coverImageUrl] : [],
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

  const safeContent = DOMPurify.sanitize(post.content)
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
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <article className="page-shell max-w-5xl">
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          {post.tags?.[0] && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wide mb-4 block">{post.tags[0]}</span>
          )}
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight tracking-tight">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            {date && <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{date}</span>}
            {post.reading_time_min && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{post.reading_time_min} min read</span>}
          </div>

          <div className="grid lg:grid-cols-[56px_minmax(0,1fr)] gap-6 lg:gap-8">
            <aside className="hidden lg:flex flex-col gap-2 sticky top-24 self-start">
              <a href={shareLinks.x} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className="social-icon-btn">
                <XIcon className="h-3.5 w-3.5" />
              </a>
              <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" className="social-icon-btn">
                <LinkedInIcon className="h-3.5 w-3.5" />
              </a>
              <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="social-icon-btn">
                <FacebookIcon className="h-3.5 w-3.5" />
              </a>
            </aside>

            <div>
              <div className="lg:hidden flex flex-wrap items-center gap-2 mb-6">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Share</span>
                <a href={shareLinks.x} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className="social-icon-btn">
                  <XIcon className="h-3.5 w-3.5" />
                </a>
                <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" className="social-icon-btn">
                  <LinkedInIcon className="h-3.5 w-3.5" />
                </a>
                <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="social-icon-btn">
                  <FacebookIcon className="h-3.5 w-3.5" />
                </a>
              </div>

              {coverImageUrl && (
                <div className="relative h-72 sm:h-96 rounded-[10px] overflow-hidden mb-8">
                  <Image src={coverImageUrl} alt={post.title} fill unoptimized className="object-cover" />
                </div>
              )}

              {post.excerpt && (
                <div className="mb-8 rounded-[10px] border border-black/20 bg-background/70 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">TL;DR</p>
                  <p className="text-sm leading-relaxed text-foreground/90">{post.excerpt}</p>
                </div>
              )}

              {post.video_embed_url && (
                <div className="aspect-video mb-8 rounded-[10px] overflow-hidden">
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
                className="prose prose-base sm:prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:mt-12 prose-h2:mb-4 prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-foreground/90 prose-li:leading-relaxed prose-blockquote:border-l-black/45 prose-blockquote:text-foreground/80 prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-img:rounded-[10px]"
                dangerouslySetInnerHTML={{ __html: safeContent }}
              />

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-black/20">
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-[6px] text-xs bg-background border border-black/20 text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-10 pt-8 border-t border-black/20">
                <p className="text-sm font-semibold mb-2">Get the next briefing first</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Weekly AI signal for builders: what shipped, what changed, and what to do next.
                </p>
                <div className="max-w-lg">
                  <NewsletterBanner source="blog-post" />
                </div>
                <Link href="/blog" className="inline-block mt-4 text-sm font-semibold text-primary hover:underline">
                  Back to all briefings
                </Link>
              </div>
            </div>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold mb-4">More from AI Briefing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
