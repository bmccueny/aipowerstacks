export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 w-72 bg-muted rounded-lg mb-3" />
      <div className="h-4 w-48 bg-muted/60 rounded mb-10" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-foreground/[0.06] p-5 flex items-center gap-4">
            <div className="h-12 w-12 bg-muted rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-3 w-64 bg-muted/50 rounded" />
            </div>
            <div className="h-8 w-20 bg-muted rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
