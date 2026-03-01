import { ToolCardSkeleton } from '@/components/tools/ToolCardSkeleton'
import { Sparkles } from 'lucide-react'

export default function ToolsLoading() {
  return (
    <div className="page-shell space-y-5 sm:space-y-6">
      <section className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Search + Filter
        </div>
        <div className="h-10 w-64 bg-muted animate-pulse rounded-md mx-auto mb-2" />
        <div className="h-5 w-96 bg-muted animate-pulse rounded-md mx-auto" />
      </section>

      <div className="glass-card rounded-md border-[1.5px] border-foreground p-4 mb-2 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 flex-1 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      </div>

      <div className="h-4 w-48 bg-muted animate-pulse rounded-md mb-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ToolCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
