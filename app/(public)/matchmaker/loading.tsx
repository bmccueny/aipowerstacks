export default function MatchmakerLoading() {
  return (
    <div className="page-shell max-w-3xl mx-auto space-y-6">
      <section className="page-hero text-center">
        <div className="h-10 w-64 shimmer rounded-lg mx-auto mb-3" />
        <div className="h-5 w-80 max-w-full shimmer rounded-lg mx-auto" />
      </section>
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="h-12 w-full shimmer rounded-xl" />
        <div className="h-10 w-32 shimmer rounded-xl mx-auto" />
      </div>
    </div>
  )
}
