export default function AdminLoading() {
  return (
    <div>
      <div className="h-8 w-48 bg-muted animate-pulse rounded-md mb-6" />

      {/* Stats grid matching AdminOverviewStats layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-md p-5 space-y-3">
            <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
