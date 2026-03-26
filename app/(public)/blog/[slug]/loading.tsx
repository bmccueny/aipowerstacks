import { SkeletonText } from '@/components/ui/SkeletonKit'

export default function BlogPostLoading() {
  return (
    <div className="page-shell max-w-7xl mx-auto">
      {/* Back link */}
      <div className="h-4 w-32 shimmer rounded-md mb-6" />

      {/* Cover image */}
      <div className="aspect-video lg:aspect-[2/1] shimmer rounded-2xl mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
        <div>
          <div className="glass-card rounded-2xl overflow-hidden mb-12">
            <div className="p-8 sm:p-10 space-y-5">
              {/* Tags */}
              <div className="flex gap-2">
                <div className="h-6 w-16 shimmer rounded-full" />
                <div className="h-6 w-20 shimmer rounded-full shimmer-delay-1" />
              </div>
              {/* Title */}
              <div className="h-9 w-full shimmer rounded-lg" />
              <div className="h-9 w-3/4 shimmer rounded-lg shimmer-delay-1" />
              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                <div className="h-10 w-10 shimmer rounded-full" />
                <div className="space-y-1.5">
                  <div className="h-3 w-20 shimmer rounded-md" />
                  <div className="h-4 w-28 shimmer rounded-md shimmer-delay-1" />
                </div>
              </div>
              {/* Body */}
              <div className="pt-6 space-y-6">
                <SkeletonText lines={4} />
                <div className="h-6 w-48 shimmer rounded-md" />
                <SkeletonText lines={5} />
                <div className="h-6 w-36 shimmer rounded-md shimmer-delay-1" />
                <SkeletonText lines={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-8">
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="h-4 w-28 shimmer rounded-md" />
              <div className="h-3 w-full shimmer rounded-md shimmer-delay-1" />
              <div className="h-3 w-full shimmer rounded-md shimmer-delay-2" />
              <div className="h-3 w-3/4 shimmer rounded-md shimmer-delay-3" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
