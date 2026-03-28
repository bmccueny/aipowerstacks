export default function CompareLoading() {
  return (
    <div className="page-shell space-y-6">
      <section className="page-hero text-center">
        <div className="h-10 w-64 shimmer rounded-lg mx-auto mb-3" />
        <div className="h-5 w-96 max-w-full shimmer rounded-lg mx-auto" />
      </section>
      <div className="glass-card rounded-xl p-6">
        <div className="h-10 w-full shimmer rounded-xl mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 shimmer rounded-xl" />
          <div className="h-48 shimmer rounded-xl" />
        </div>
      </div>
    </div>
  )
}
