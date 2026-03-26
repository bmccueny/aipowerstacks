import { SkeletonBlogCard } from '@/components/ui/SkeletonKit'
import { Newspaper } from 'lucide-react'

export default function BlogLoading() {
  return (
    <div className="page-shell">
      <section className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4 skeleton-glow">
          <Newspaper className="h-3.5 w-3.5" />
          Blog
        </div>
        <div className="h-10 w-48 shimmer rounded-lg mx-auto mb-3" />
        <div className="h-5 w-80 max-w-full shimmer rounded-lg mx-auto" />
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlogCard key={i} index={i} />
        ))}
      </div>
    </div>
  )
}
