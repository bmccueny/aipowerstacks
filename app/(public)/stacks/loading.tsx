import { Layers } from 'lucide-react'

export default function StacksLoading() {
  return (
    <div className="page-shell">
      <div className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Layers className="h-3.5 w-3.5" />
          Community Workflows
        </div>
        <div className="h-10 w-56 bg-muted animate-pulse rounded-md mx-auto mb-2" />
        <div className="h-5 w-96 bg-muted animate-pulse rounded-md mx-auto" />
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="h-4 w-28 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-36 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Stack cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="glass-card rounded-md overflow-hidden flex flex-col">
            <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
            <div className="p-5 flex flex-col gap-4">
              {/* Name + description */}
              <div className="space-y-2">
                <div className="h-6 w-3/4 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded-md" />
              </div>

              {/* Tool avatars row */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div
                      key={j}
                      className="h-7 w-7 rounded-full bg-muted animate-pulse border-2 border-background"
                      style={{ marginLeft: j === 0 ? 0 : -10 }}
                    />
                  ))}
                </div>
                <div className="h-3 w-16 bg-muted animate-pulse rounded-md" />
              </div>

              {/* Creator row */}
              <div className="flex items-center gap-3 pt-4 border-t border-foreground/5">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-2.5 w-16 bg-muted animate-pulse rounded-md" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
