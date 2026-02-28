export function ToolCardSkeleton({ view = 'grid' }: { view?: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="glass-card rounded-[6px] px-4 py-3 flex items-center gap-4">
        <div className="h-10 w-10 rounded-[6px] shimmer shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 shimmer rounded" />
          <div className="h-3 w-48 shimmer rounded" />
        </div>
        <div className="h-5 w-16 rounded-full shimmer" />
      </div>
    )
  }

  return (
    <div className="glass-card rounded-[6px] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-[6px] shimmer shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 shimmer rounded" />
          <div className="h-5 w-16 rounded-full shimmer" />
        </div>
      </div>
      <div className="h-3 w-full shimmer rounded" />
      <div className="h-3 w-4/5 shimmer rounded" />
      <div className="flex justify-between pt-1 border-t border-black/10">
        <div className="h-3 w-16 shimmer rounded" />
        <div className="h-3 w-3 shimmer rounded" />
      </div>
    </div>
  )
}
