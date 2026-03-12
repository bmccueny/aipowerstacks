import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, Home, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="page-shell flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-6xl font-black text-foreground/20">404</h1>
        <h2 className="text-2xl font-bold">Page not found</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md glass-card border border-foreground/10 hover:border-foreground/20 transition-colors text-sm font-medium"
        >
          <Home className="h-4 w-4" />
          Go Home
        </Link>
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md glass-card border border-foreground/10 hover:border-foreground/20 transition-colors text-sm font-medium"
        >
          <Search className="h-4 w-4" />
          Browse Tools
        </Link>
        <Link
          href="/matchmaker"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md glass-card border border-foreground/10 hover:border-foreground/20 transition-colors text-sm font-medium"
        >
          <Sparkles className="h-4 w-4" />
          AI Matchmaker
        </Link>
      </div>
    </div>
  )
}
