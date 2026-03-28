export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-14 w-14 bg-muted rounded-2xl shrink-0" />
        <div className="space-y-2">
          <div className="h-7 w-56 bg-muted rounded-lg" />
          <div className="h-3 w-32 bg-muted/60 rounded" />
        </div>
      </div>
      <div className="h-4 w-full bg-muted/40 rounded mb-2" />
      <div className="h-4 w-5/6 bg-muted/40 rounded mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-foreground/[0.06] px-5 py-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-muted rounded" />
              <div className="h-3 w-52 bg-muted/50 rounded" />
            </div>
            <div className="h-5 w-14 bg-muted/40 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
