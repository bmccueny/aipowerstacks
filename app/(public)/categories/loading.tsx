import { Sparkles } from 'lucide-react'

export default function CategoriesLoading() {
  return (
    <div className="page-shell">
      <div className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Browse By Workflow
        </div>
        <div className="h-10 w-64 bg-muted animate-pulse rounded-md mx-auto mb-2" />
        <div className="h-5 w-80 bg-muted animate-pulse rounded-md mx-auto" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="glass-card rounded-md p-3 flex flex-col items-center justify-center gap-2 min-h-[100px]"
          >
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1.5 text-center">
              <div className="h-4 w-20 bg-muted animate-pulse rounded-md mx-auto" />
              <div className="h-3 w-14 bg-muted animate-pulse rounded-md mx-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
