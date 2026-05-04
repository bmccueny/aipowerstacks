export default function TrackerLoading() {
  return (
    <div className="page-shell max-w-4xl mx-auto pb-24">
      {/* Hero skeleton */}
      <div className="rounded-xl border border-border bg-muted/30 p-8 mb-8 text-center">
        <div className="h-5 w-32 bg-muted rounded-full mx-auto mb-3 shimmer" />
        <div className="h-8 w-64 bg-muted rounded mx-auto mb-2 shimmer" />
        <div className="h-4 w-80 bg-muted/60 rounded mx-auto shimmer" />
      </div>

      {/* Search bar skeleton */}
      <div className="h-12 w-full bg-muted rounded-xl mb-6 shimmer" />

      {/* Subscription cards skeleton */}
      <div className="space-y-2 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted shrink-0 shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-28 bg-muted rounded shimmer" />
              <div className="h-2.5 w-20 bg-muted/60 rounded shimmer" />
            </div>
            <div className="h-5 w-16 bg-muted rounded shimmer" />
          </div>
        ))}
      </div>

      {/* Analytics cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Benchmark card skeleton */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted rounded shimmer" />
            <div className="h-4 w-32 bg-muted rounded shimmer" />
          </div>
          <div className="flex justify-center">
            <div className="w-40 h-20 bg-muted/40 rounded-t-full shimmer" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="text-center space-y-1">
                <div className="h-5 w-12 bg-muted rounded mx-auto shimmer" />
                <div className="h-2.5 w-16 bg-muted/60 rounded mx-auto shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Cohort card skeleton */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted rounded shimmer" />
            <div className="h-4 w-28 bg-muted rounded shimmer" />
          </div>
          <div className="h-3 w-48 bg-muted/60 rounded shimmer" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                <div className="h-8 w-8 rounded-lg bg-muted shrink-0 shimmer" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 bg-muted rounded shimmer" />
                  <div className="h-2 w-32 bg-muted/60 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
