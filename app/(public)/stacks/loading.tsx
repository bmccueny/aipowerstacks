import { Layers } from 'lucide-react'

export default function StacksLoading() {
  return (
    <div className="page-shell">
      <div className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4 skeleton-glow">
          <Layers className="h-3.5 w-3.5" />
          Community Workflows
        </div>
        <div className="h-10 w-48 shimmer rounded-lg mx-auto mb-3" />
        <div className="h-5 w-80 max-w-full shimmer rounded-lg mx-auto" />
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto my-6">
        <div className="h-10 w-full shimmer rounded-xl" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl overflow-hidden">
            <div className="h-1 shimmer" style={{ animationDelay: `${i * 0.06}s` }} />
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="h-5 w-3/4 shimmer rounded-md" style={{ animationDelay: `${i * 0.06 + 0.1}s` }} />
                <div className="h-3 w-full shimmer rounded-md" style={{ animationDelay: `${i * 0.06 + 0.15}s` }} />
                <div className="h-3 w-2/3 shimmer rounded-md" style={{ animationDelay: `${i * 0.06 + 0.2}s` }} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-7 w-7 shimmer rounded-full border-2 border-background" />
                  ))}
                </div>
                <div className="h-3 w-16 shimmer rounded-md" />
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-foreground/5">
                <div className="h-8 w-8 shimmer rounded-full" />
                <div className="space-y-1">
                  <div className="h-2.5 w-16 shimmer rounded-md" />
                  <div className="h-3.5 w-24 shimmer rounded-md" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
