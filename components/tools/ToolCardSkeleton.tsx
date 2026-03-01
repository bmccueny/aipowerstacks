export function ToolCardSkeleton({ view = 'grid' }: { view?: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="glass-card rounded-md px-4 py-3.5 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 group relative">
        <div className="h-10 w-10 shrink-0 rounded-md bg-muted shimmer flex items-center justify-center" />
        <div className="flex-1 min-w-[180px] space-y-2">
          <div className="h-4 w-32 shimmer rounded" />
          <div className="h-3 w-48 shimmer rounded" />
          <div className="flex gap-2">
            <div className="h-4 w-12 shimmer rounded-full" />
            <div className="h-4 w-12 shimmer rounded-full" />
          </div>
        </div>
        <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          <div className="h-4 w-16 shimmer rounded" />
          <div className="h-8 w-16 shimmer rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative glass-card rounded-md h-full flex flex-col overflow-hidden">
      <div className="h-32 border-b border-foreground/10 shrink-0 shimmer" />
      <div className="p-4 flex flex-col gap-3.5 flex-1">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 shrink-0 rounded-md bg-muted shimmer" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 w-28 shimmer rounded" />
            <div className="h-4 w-16 shimmer rounded" />
          </div>
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-3 w-full shimmer rounded" />
          <div className="h-3 w-4/5 shimmer rounded" />
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-foreground/10 gap-3">
          <div className="h-4 w-16 shimmer rounded" />
          <div className="h-8 w-8 shimmer rounded-md" />
        </div>
      </div>
    </div>
  )
}
