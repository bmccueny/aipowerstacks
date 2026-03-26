import { SkeletonCard } from '@/components/ui/SkeletonKit'
import { Search } from 'lucide-react'

export default function ToolsLoading() {
  return (
    <div className="page-shell space-y-5 sm:space-y-6">
      <section className="page-hero text-center">
        <div className="h-6 w-32 shimmer rounded-full mx-auto mb-4" />
        <div className="h-10 w-72 shimmer rounded-lg mx-auto mb-3" />
        <div className="h-5 w-96 max-w-full shimmer rounded-lg mx-auto" />
      </section>

      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
            <div className="h-10 w-full shimmer rounded-xl" />
          </div>
          <div className="h-10 w-24 shimmer rounded-xl" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 shimmer rounded-full" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    </div>
  )
}
