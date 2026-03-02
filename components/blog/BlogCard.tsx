import Link from 'next/link'
import Image from 'next/image'
import { Clock, Calendar } from 'lucide-react'
import type { BlogPostSummary } from '@/lib/supabase/queries/blog'

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

export function BlogCard({ post, featured = false }: { post: BlogPostSummary; featured?: boolean }) {
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null
  const coverImageUrl = normalizeThumUrl(post.cover_image_url)

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="block group">
        <div className="override grid h-full overflow-hidden rounded-lg brutalist-card-effect no-underline lg:grid-cols-2">
          {coverImageUrl ? (
            <div className="relative h-56 lg:h-auto lg:w-1/2 shrink-0">
              <Image src={coverImageUrl} alt={post.title} fill unoptimized className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent" />
            </div>
          ) : (
            <div className="h-56 lg:h-auto lg:w-1/2 shrink-0 bg-gradient-to-br from-primary/10 to-amber-100 flex items-center justify-center">
              <span className="text-6xl opacity-20">✦</span>
            </div>
          )}
          <div className="p-7 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-6 rounded-full border border-black/10 bg-primary/10 flex items-center justify-center overflow-hidden relative">
                {post.author?.avatar_url ? (
                  <Image src={post.author.avatar_url} alt={post.author.display_name ?? ''} fill className="object-cover" />
                ) : (
                  <span className="text-[10px] font-black">{(post.author?.display_name?.[0] ?? 'A').toUpperCase()}</span>
                )}
              </div>
              <span className="text-[11px] font-bold">
                {post.author?.display_name || 'AIPowerStacks Team'}
                {post.author?.username && (
                  <span className="text-muted-foreground ml-1.5 font-medium">@{post.author.username}</span>
                )}
              </span>
            </div>
            {post.tags?.[0] && (
              <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">{post.tags[0]}</span>
            )}
            <h2 className="text-2xl font-bold mb-3 pb-0.5 transition-colors line-clamp-2 leading-[1.25]">{post.title}</h2>
            <p className="text-muted-foreground text-[14px] line-clamp-2 mb-5 pb-0.5 leading-[1.6]">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
              {date && <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{date}</span>}
              {post.reading_time_min && <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{post.reading_time_min} min read</span>}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/blog/${post.slug}`} className="block group h-full">
      <div className="override grid h-full overflow-hidden rounded-lg brutalist-card-effect no-underline">
        {coverImageUrl ? (
          <div className="relative h-44 shrink-0 overflow-hidden">
            <Image src={coverImageUrl} alt={post.title} fill unoptimized className="object-cover transition-transform duration-300" />
          </div>
        ) : (
          <div className="h-44 bg-gradient-to-br from-primary/8 to-amber-100 flex items-center justify-center shrink-0">
            <span className="text-5xl opacity-20">✦</span>
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-5 rounded-full border border-black/10 bg-primary/10 flex items-center justify-center overflow-hidden relative">
              {post.author?.avatar_url ? (
                <Image src={post.author.avatar_url} alt={post.author.display_name ?? ''} fill className="object-cover" />
              ) : (
                <span className="text-[8px] font-black">{(post.author?.display_name?.[0] ?? 'A').toUpperCase()}</span>
              )}
            </div>
            <span className="text-[10px] font-bold truncate">
              {post.author?.display_name || 'AIPowerStacks Team'}
            </span>
          </div>
          {post.tags?.[0] && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{post.tags[0]}</span>
          )}
          <h3 className="font-semibold text-[16px] mb-2 pb-0.5 transition-colors line-clamp-2 flex-1 leading-[1.3]">{post.title}</h3>
          <p className="text-[13px] text-muted-foreground line-clamp-2 mb-3 pb-0.5 leading-[1.5]">{post.excerpt}</p>
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground border-t border-black/10 pt-3 mt-auto">
            {date && <span>{date}</span>}
            {post.reading_time_min && <span>{post.reading_time_min} min read</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}
