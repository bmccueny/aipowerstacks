import { Sparkles } from 'lucide-react'

export default function BlogLoading() {
  return (
    <div className="page-shell">
      <div className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          AI Briefing
        </div>
        <div className="h-10 w-80 bg-muted animate-pulse rounded-md mx-auto mb-2" />
        <div className="h-5 w-72 bg-muted animate-pulse rounded-md mx-auto" />
      </div>

      {/* Featured post skeleton */}
      <div className="mb-10">
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="aspect-[2.5/1] bg-muted animate-pulse" />
          <div className="p-6 space-y-3">
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-7 w-3/4 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-full max-w-xl bg-muted animate-pulse rounded-md" />
          </div>
        </div>
      </div>

      {/* Post grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl overflow-hidden">
            <div className="aspect-video bg-muted animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-3 w-16 bg-muted animate-pulse rounded-md" />
              <div className="h-5 w-full bg-muted animate-pulse rounded-md" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
