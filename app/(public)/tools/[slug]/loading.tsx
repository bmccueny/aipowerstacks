export default function ToolDetailLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div className="h-5 w-64 rounded bg-muted" />
      <div className="glass-card rounded-2xl p-6">
        <div className="flex gap-6">
          <div className="h-20 w-20 rounded-2xl bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-64 rounded bg-muted" />
            <div className="h-4 w-full max-w-2xl rounded bg-muted" />
            <div className="h-4 w-80 rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-2xl h-48" />
          <div className="glass-card rounded-2xl h-56" />
          <div className="glass-card rounded-2xl h-64" />
        </div>
        <div className="space-y-4">
          <div className="glass-card rounded-2xl h-56" />
          <div className="glass-card rounded-2xl h-44" />
        </div>
      </div>
    </div>
  )
}
