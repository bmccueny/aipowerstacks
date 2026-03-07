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
    <form onSubmit={handleSubmit} className="relative w-full group">
      <div className="relative">
        {/* Enhanced background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-cyan-500/10 rounded-3xl blur-xl scale-105 opacity-60" />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${toolCount}+ AI tools...`}
          className="relative w-full h-20 px-8 pr-20 rounded-3xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl text-xl font-medium outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all duration-300 placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-xl hover:shadow-2xl"
        />

        <button
          type="submit"
          aria-label="Search"
          className="absolute right-3 top-1/2 -translate-y-1/2 h-14 w-14 inline-flex items-center justify-center rounded-2xl bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
        >
          <Search className="h-6 w-6" />
        </button>
      </div>
    </form>
  )
}
