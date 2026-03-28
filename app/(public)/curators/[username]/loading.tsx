export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 bg-muted rounded-full shrink-0" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted/60 rounded" />
        </div>
      </div>
      <div className="h-4 w-full bg-muted/40 rounded mb-2" />
      <div className="h-4 w-3/4 bg-muted/40 rounded mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-foreground/[0.06] p-5 space-y-3">
            <div className="h-5 w-48 bg-muted rounded" />
            <div className="h-3 w-full bg-muted/50 rounded" />
            <div className="h-3 w-2/3 bg-muted/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
