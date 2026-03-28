export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 w-80 bg-muted rounded-lg mb-3" />
      <div className="h-4 w-56 bg-muted/60 rounded mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-foreground/[0.06] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-muted rounded-xl" />
              <div className="h-4 w-28 bg-muted rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted/50 rounded" />
              <div className="h-3 w-2/3 bg-muted/50 rounded" />
            </div>
            <div className="h-6 w-16 bg-muted/40 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
