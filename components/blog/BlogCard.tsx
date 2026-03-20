'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Clock, Calendar } from 'lucide-react'
import type { BlogPostSummary } from '@/lib/supabase/queries/blog'
import { normalizeThumUrl } from '@/lib/utils/url'

function AuthorLink({ author, size = 'sm' }: { author: BlogPostSummary['author']; size?: 'sm' | 'md' }) {
  const router = useRouter()
  const avatarSize = size === 'md' ? 'h-6 w-6' : 'h-5 w-5'
  const textSize = size === 'md' ? 'text-[11px]' : 'text-[10px]'
  const fallbackSize = size === 'md' ? 'text-[10px]' : 'text-[8px]'
  const gap = size === 'md' ? 'gap-3' : 'gap-2'

  const content = (
    <>
      <div className={`${avatarSize} rounded-full glass-card border border-border/30 bg-primary/5 flex items-center justify-center overflow-hidden relative`}>
        {author?.avatar_url ? (
          <Image src={author.avatar_url} alt={author.display_name ?? ''} fill className="object-cover" />
        ) : (
          <span className={`${fallbackSize} font-black`}>{(author?.display_name?.[0] ?? 'A').toUpperCase()}</span>
        )}
      </div>
      <span className={`${textSize} font-bold truncate`}>
        {author?.display_name || 'AIPowerStacks Team'}
        {size === 'md' && author?.username && (
          <span className="text-muted-foreground ml-1.5 font-medium">@{author.username}</span>
        )}
      </span>
    </>
  )

  if (author?.username) {
    return (
      <span
        role="link"
        tabIndex={0}
        className={`flex items-center ${gap} cursor-pointer hover:text-primary transition-colors`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          router.push(`/curators/${author.username}`)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            router.push(`/curators/${author.username}`)
          }
        }}
      >
        {content}
      </span>
    )
  }

  return <div className={`flex items-center ${gap}`}>{content}</div>
}

export function BlogCard({ post, featured = false }: { post: BlogPostSummary; featured?: boolean }) {
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null
  const coverImageUrl = normalizeThumUrl(post.cover_image_url)

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="block group">
        <div className="override grid h-full overflow-hidden rounded-lg brutalist-card-effect burn-glow-card no-underline lg:grid-cols-2">
          {coverImageUrl ? (
            <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-[320px] shrink-0">
              <Image src={coverImageUrl} alt={post.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
            </div>
          ) : (
            <div className="aspect-[16/9] lg:aspect-auto lg:min-h-[320px] shrink-0 bg-gradient-to-br from-primary/10 to-amber-100 flex items-center justify-center">
              <span className="text-6xl opacity-20">✦</span>
            </div>
          )}
          <div className="p-7 flex flex-col justify-center">
            <div className="mb-4">
              <AuthorLink author={post.author} size="md" />
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
      <div className="override grid h-full overflow-hidden rounded-lg brutalist-card-effect burn-glow-card no-underline">
        {coverImageUrl ? (
          <div className="relative aspect-video shrink-0 overflow-hidden">
            <Image src={coverImageUrl} alt={post.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-300" />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-primary/8 to-amber-100 flex items-center justify-center shrink-0">
            <span className="text-5xl opacity-20">✦</span>
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <div className="mb-3">
            <AuthorLink author={post.author} size="sm" />
          </div>
          {post.tags?.[0] && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{post.tags[0]}</span>
          )}
          <h3 className="font-semibold text-[16px] mb-2 pb-0.5 transition-colors line-clamp-2 flex-1 leading-[1.3]">{post.title}</h3>
          <p className="text-[13px] text-muted-foreground line-clamp-2 mb-3 pb-0.5 leading-[1.5]">{post.excerpt}</p>
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground border-t border-border/30 pt-3 mt-auto">
            {date && <span>{date}</span>}
            {post.reading_time_min && <span>{post.reading_time_min} min read</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}
