export default function Loading() {
  return (
    <div className="page-shell space-y-6">
      <section className="page-hero text-center">
        <div className="h-10 w-64 shimmer rounded-lg mx-auto mb-3" />
        <div className="h-5 w-96 max-w-full shimmer rounded-lg mx-auto" />
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 shimmer rounded-2xl" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  )
}
