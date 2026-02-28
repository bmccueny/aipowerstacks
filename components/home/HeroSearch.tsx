'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'

export function HeroSearch({ toolCount }: { toolCount: number }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/tools?q=${encodeURIComponent(q)}` : '/tools')
  }

  return (
    <form onSubmit={handleSubmit} className="search-bar mt-10 rounded-[4px] flex items-center gap-3 w-full max-w-3xl px-5 sm:px-6 py-3">
      <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${toolCount}+ tools — writing, coding, image, video...`}
        className="flex-1 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground outline-none min-w-0"
      />
      <button
        type="submit"
        aria-label="Search"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-[4px] bg-foreground text-background px-4 py-1.5 text-sm font-semibold hover:bg-primary hover:text-foreground transition-colors"
      >
        <span className="hidden sm:inline">Search</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </form>
  )
}
