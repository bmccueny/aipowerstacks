export default function CategoryDetailLoading() {
  return (
    <div className="page-shell">
      <div className="page-hero flex flex-col items-start sm:flex-row sm:items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-9 w-56 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-80 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Tool grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="glass-card rounded-md p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded-md" />
              </div>
            </div>
            <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
