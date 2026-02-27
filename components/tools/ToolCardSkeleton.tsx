import { Skeleton } from '@/components/ui/skeleton'

export function ToolCardSkeleton({ view = 'grid' }: { view?: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-32 bg-white/10" />
          <Skeleton className="h-3 w-48 bg-white/5" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 rounded-xl bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28 bg-white/10" />
          <Skeleton className="h-5 w-16 rounded-full bg-white/5" />
        </div>
      </div>
      <Skeleton className="h-3 w-full bg-white/5" />
      <Skeleton className="h-3 w-4/5 bg-white/5" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16 bg-white/5" />
        <Skeleton className="h-3 w-3 bg-white/5" />
      </div>
    </div>
  )
}
