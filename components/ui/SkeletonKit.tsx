import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shimmer', className)} {...props} />
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn('shimmer h-3.5 rounded-md', i === lines - 1 ? 'w-2/3' : 'w-full', `shimmer-delay-${(i % 3) + 1}`)}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ index = 0 }: { index?: number }) {
  const delay = (index % 4) * 0.08
  return (
    <div
      className="glass-card rounded-xl overflow-hidden flex flex-col"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Top accent bar */}
      <div className="h-1 shimmer" style={{ animationDelay: `${delay}s` }} />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Logo + name */}
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 rounded-xl shimmer" style={{ animationDelay: `${delay + 0.05}s` }} />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-5 w-3/4 shimmer rounded-md" style={{ animationDelay: `${delay + 0.1}s` }} />
            <div className="flex gap-2">
              <div className="h-4 w-12 shimmer rounded-full" style={{ animationDelay: `${delay + 0.15}s` }} />
              <div className="h-4 w-8 shimmer rounded-full" style={{ animationDelay: `${delay + 0.2}s` }} />
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <div className="h-3.5 w-full shimmer rounded-md" style={{ animationDelay: `${delay + 0.15}s` }} />
          <div className="h-3.5 w-4/5 shimmer rounded-md" style={{ animationDelay: `${delay + 0.2}s` }} />
        </div>

        {/* Badges */}
        <div className="flex gap-1.5">
          <div className="h-5 w-16 shimmer rounded-full" style={{ animationDelay: `${delay + 0.25}s` }} />
          <div className="h-5 w-10 shimmer rounded-full" style={{ animationDelay: `${delay + 0.3}s` }} />
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-foreground/5 flex gap-2">
          <div className="h-9 flex-1 shimmer rounded-lg" style={{ animationDelay: `${delay + 0.3}s` }} />
          <div className="h-9 w-9 shimmer rounded-lg" style={{ animationDelay: `${delay + 0.35}s` }} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonBlogCard({ index = 0 }: { index?: number }) {
  const delay = (index % 3) * 0.1
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Cover image */}
      <div className="aspect-video shimmer" style={{ animationDelay: `${delay}s` }} />

      <div className="p-5 space-y-3">
        {/* Tag */}
        <div className="h-5 w-20 shimmer rounded-full" style={{ animationDelay: `${delay + 0.1}s` }} />
        {/* Title */}
        <div className="h-5 w-full shimmer rounded-md" style={{ animationDelay: `${delay + 0.15}s` }} />
        <div className="h-5 w-3/4 shimmer rounded-md" style={{ animationDelay: `${delay + 0.2}s` }} />
        {/* Author */}
        <div className="flex items-center gap-2 pt-2">
          <div className="h-6 w-6 shimmer rounded-full" style={{ animationDelay: `${delay + 0.25}s` }} />
          <div className="h-3 w-24 shimmer rounded-md" style={{ animationDelay: `${delay + 0.3}s` }} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonToolDetail() {
  return (
    <div className="page-shell max-w-7xl mx-auto space-y-6">
      {/* Back link */}
      <div className="h-4 w-32 shimmer rounded-md" />

      {/* Hero */}
      <div className="glass-card rounded-2xl p-8 sm:p-10">
        <div className="flex items-start gap-5">
          <div className="h-20 w-20 shrink-0 shimmer rounded-2xl" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-48 shimmer rounded-md" />
            <div className="h-4 w-full shimmer rounded-md shimmer-delay-1" />
            <div className="h-4 w-2/3 shimmer rounded-md shimmer-delay-2" />
            <div className="flex gap-2 pt-2">
              <div className="h-6 w-20 shimmer rounded-full" />
              <div className="h-6 w-16 shimmer rounded-full shimmer-delay-1" />
              <div className="h-6 w-24 shimmer rounded-full shimmer-delay-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="h-6 w-32 shimmer rounded-md" />
            <SkeletonText lines={5} />
          </div>
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="h-6 w-24 shimmer rounded-md" />
            <SkeletonText lines={3} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5 space-y-3">
            <div className="h-11 w-full shimmer rounded-lg" />
            <div className="h-11 w-full shimmer rounded-lg shimmer-delay-1" />
            <div className="h-11 w-full shimmer rounded-lg shimmer-delay-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
