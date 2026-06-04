import { SkeletonBlogCard } from '@/components/ui/SkeletonKit'

export default function BlogCategoryLoading() {
  return (
    <div className="page-shell">
      {/* Breadcrumb shimmer */}
      <div className="h-5 w-40 shimmer rounded mb-6" />

      {/* Heading shimmer */}
      <div className="text-center pt-2 pb-8">
        <div className="h-10 w-56 shimmer rounded-lg mx-auto mb-3" />
        <div className="h-5 w-72 max-w-full shimmer rounded-lg mx-auto" />
      </div>

      {/* Category pill row shimmer */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 shimmer rounded-full" />
        ))}
      </div>

      {/* Post grid shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlogCard key={i} index={i} />
        ))}
      </div>
    </div>
  )
}
