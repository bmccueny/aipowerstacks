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
    <form onSubmit={handleSubmit} className="relative mt-10 w-full max-w-3xl group">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${toolCount}+ tools ...`}
        className="w-full h-14 lg:h-16 px-8 rounded-lg border border-black/20 bg-white text-xl outline-none focus:ring-1 focus:ring-black focus:border-black/60 transition-all dark:bg-zinc-900 dark:border-white/20 dark:text-white dark:focus:ring-white/40 dark:focus:border-white/60"
        style={{ paddingLeft: '2rem', paddingRight: '5rem' }}
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 lg:h-12 lg:w-12 inline-flex items-center justify-center rounded-md bg-black text-white hover:bg-primary transition-colors z-10"
      >
        <Search className="h-5 w-5 lg:h-6 lg:w-6" />
      </button>
    </form>
  )
}
