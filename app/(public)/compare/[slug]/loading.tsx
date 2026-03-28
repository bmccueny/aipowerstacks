export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 w-64 bg-muted rounded-lg mx-auto mb-3" />
      <div className="h-4 w-96 bg-muted/60 rounded mx-auto mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-foreground/[0.06] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-muted rounded-xl" />
            <div className="h-5 w-32 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-muted/50 rounded" />
            <div className="h-3 w-3/4 bg-muted/50 rounded" />
            <div className="h-3 w-5/6 bg-muted/50 rounded" />
          </div>
        </div>
        <div className="rounded-2xl border border-foreground/[0.06] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-muted rounded-xl" />
            <div className="h-5 w-32 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-muted/50 rounded" />
            <div className="h-3 w-3/4 bg-muted/50 rounded" />
            <div className="h-3 w-5/6 bg-muted/50 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
