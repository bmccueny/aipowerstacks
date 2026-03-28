export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 w-72 bg-muted rounded-lg mb-3" />
      <div className="h-4 w-96 bg-muted/60 rounded mb-8" />
      <div className="rounded-2xl border border-foreground/[0.06] p-6 space-y-4 mb-6">
        <div className="h-5 w-40 bg-muted rounded" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted/50 rounded" />
          <div className="h-3 w-4/5 bg-muted/50 rounded" />
          <div className="h-3 w-3/4 bg-muted/50 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-foreground/[0.06] px-5 py-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
