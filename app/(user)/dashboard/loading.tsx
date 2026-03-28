export default function DashboardLoading() {
  return (
    <div className="page-shell space-y-6">
      <div className="h-10 w-48 shimmer rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-6 space-y-3" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="h-6 w-24 shimmer rounded-lg" />
            <div className="h-4 w-full shimmer rounded-lg" />
            <div className="h-4 w-3/4 shimmer rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
