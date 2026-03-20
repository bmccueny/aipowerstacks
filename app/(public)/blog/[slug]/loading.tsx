export default function BlogPostLoading() {
  return (
    <div className="page-shell max-w-4xl mx-auto">
      {/* Back link */}
      <div className="h-4 w-32 bg-muted animate-pulse rounded-md mb-6" />

      {/* Cover image */}
      <div className="aspect-video rounded-2xl bg-muted animate-pulse mb-8" />

      {/* Article card */}
      <div className="glass-card rounded-2xl overflow-hidden mb-12">
        <div className="p-8 sm:p-10 space-y-5">
          {/* Tag + date */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-28 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
          </div>

          {/* Title */}
          <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-2/3 bg-muted animate-pulse rounded-md" />

          {/* Author row */}
          <div className="flex items-center gap-3 pb-8 border-b border-border/40">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded-md" />
            </div>
          </div>

          {/* Content lines */}
          <div className="space-y-4 pt-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-muted animate-pulse rounded-md"
                style={{ width: `${70 + Math.random() * 30}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Related posts */}
      <div className="h-6 w-48 bg-muted animate-pulse rounded-md mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl overflow-hidden">
            <div className="aspect-video bg-muted animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-3 w-16 bg-muted animate-pulse rounded-md" />
              <div className="h-5 w-full bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
