export default function AuthLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="glass-card rounded-xl p-8 w-full max-w-md space-y-4">
        <div className="h-8 w-32 shimmer rounded-lg mx-auto" />
        <div className="space-y-3">
          <div className="h-10 w-full shimmer rounded-xl" />
          <div className="h-10 w-full shimmer rounded-xl" />
          <div className="h-10 w-full shimmer rounded-xl" />
        </div>
      </div>
    </div>
  )
}
