export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center px-4 py-8 bg-background overflow-y-auto">
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}
