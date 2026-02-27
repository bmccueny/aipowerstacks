import Link from 'next/link'
import Image from 'next/image'
import { Clock, Calendar } from 'lucide-react'
import type { BlogPostSummary } from '@/lib/supabase/queries/blog'

export function BlogCard({ post, featured = false }: { post: BlogPostSummary; featured?: boolean }) {
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="block group">
        <div className="glass-card rounded-xl overflow-hidden flex flex-col lg:flex-row gap-0">
          {post.cover_image_url && (
            <div className="relative h-56 lg:h-auto lg:w-1/2 shrink-0">
              <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" />
            </div>
          )}
          <div className="p-6 flex flex-col justify-center">
            {post.tags?.[0] && (
              <span className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">{post.tags[0]}</span>
            )}
            <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-3">{post.title}</h2>
            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date}</span>}
              {post.reading_time_min && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.reading_time_min} min read</span>}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <div className="glass-card rounded-xl overflow-hidden h-full flex flex-col">
        {post.cover_image_url ? (
          <div className="relative h-44 shrink-0">
            <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" />
          </div>
        ) : (
          <div className="h-44 bg-primary/5 flex items-center justify-center shrink-0">
            <span className="text-4xl opacity-30">📝</span>
          </div>
        )}
        <div className="p-4 flex flex-col flex-1">
          {post.tags?.[0] && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">{post.tags[0]}</span>
          )}
          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2 flex-1">{post.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {date && <span>{date}</span>}
            {post.reading_time_min && <span>{post.reading_time_min} min</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}
