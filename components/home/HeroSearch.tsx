'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

// Specific, high-intent prompts — research-backed: concrete examples outperform generic placeholders
const PROMPTS = [
  'AI that writes code faster than I can think...',
  'Replace my $500/mo design tool with AI...',
  'Transcribe 2 hours of meetings in seconds...',
  'Generate a full marketing campaign overnight...',
  'AI that reads PDFs and answers questions...',
  'Turn my rough idea into a working prototype...',
  'Automate my customer support without losing the human touch...',
  'Write better cold emails that actually get replies...',
  'Edit videos 10x faster with AI...',
  'An AI that learns my writing style...',
]

export function HeroSearch({ toolCount }: { toolCount: number }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [promptIndex, setPromptIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Typewriter effect
  useEffect(() => {
    if (query) return // stop animating once user types

    const current = PROMPTS[promptIndex]

    if (isPaused) {
      const pause = setTimeout(() => {
        setIsPaused(false)
        setIsDeleting(true)
      }, 2200)
      return () => clearTimeout(pause)
    }

    if (isDeleting) {
      if (displayed.length === 0) {
        setIsDeleting(false)
        setPromptIndex((i) => (i + 1) % PROMPTS.length)
        return
      }
      const del = setTimeout(() => setDisplayed((d) => d.slice(0, -1)), 28)
      return () => clearTimeout(del)
    }

    if (displayed.length < current.length) {
      const type = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 45)
      return () => clearTimeout(type)
    }

    // Fully typed — pause before deleting
    setIsPaused(true)
  }, [displayed, isDeleting, isPaused, promptIndex, query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/tools?q=${encodeURIComponent(q)}` : '/tools')
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full group">
      <div className="relative">
        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-cyan-500/10 rounded-3xl blur-xl scale-105 opacity-60" />

        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={query ? '' : displayed || ' '}
            className="w-full h-20 px-8 pr-20 rounded-3xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl text-xl font-medium outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal shadow-xl hover:shadow-2xl"
          />

          {/* Animated cursor in placeholder when empty */}
          {!query && (
            <span
              className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-gray-500 font-normal select-none"
              aria-hidden
            >
              {displayed}
              <span className="inline-block w-0.5 h-5 bg-primary/60 ml-0.5 align-middle animate-pulse" />
            </span>
          )}
        </div>

        <button
          type="submit"
          aria-label="Search"
          className="absolute right-3 top-1/2 -translate-y-1/2 h-14 w-14 inline-flex items-center justify-center rounded-2xl bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
        >
          <Search className="h-6 w-6" />
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-3">
        {toolCount.toLocaleString()}+ tools across {' '}
        <span className="text-primary font-medium">AI writing</span>,{' '}
        <span className="text-primary font-medium">coding</span>,{' '}
        <span className="text-primary font-medium">video</span>,{' '}
        <span className="text-primary font-medium">automation</span> and more
      </p>
    </form>
  )
}
