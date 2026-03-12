'use client'

import { useState, useEffect, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'

export function ToolSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const [recent, setRecent] = useState<string[]>([])
  const debouncedValue = useDebounce(value, 300)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('recent_tool_searches')
      const parsed = stored ? JSON.parse(stored) : []
      if (Array.isArray(parsed)) {
        setRecent(parsed.filter((v) => typeof v === 'string').slice(0, 6))
      }
    } catch {
      setRecent([])
    }
  }, [])

  useEffect(() => {
    if (!debouncedValue || debouncedValue.trim().length < 2) return
    const normalized = debouncedValue.trim()
    setRecent((prev) => {
      const next = [normalized, ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 6)
      try {
        window.localStorage.setItem('recent_tool_searches', JSON.stringify(next))
      } catch {
        // Ignore storage errors.
      }
      return next
    })
  }, [debouncedValue])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedValue) {
      params.set('q', debouncedValue)
    } else {
      params.delete('q')
    }
    params.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }, [debouncedValue])

  const applyRecent = (term: string) => {
    setValue(term)
    const params = new URLSearchParams(searchParams.toString())
    params.set('q', term)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex-1 space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search tools or describe what you need..."
          className="pl-9 pr-9 glass-card border-border/50 focus:ring-2 focus:ring-primary/50 focus:border-primary/60"
        />
        {value && (
          <button
            onClick={() => setValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {recent.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recent.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => applyRecent(term)}
              className="rounded-full border border-black/25 px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground hover:border-black/45 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
