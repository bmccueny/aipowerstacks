'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, Loader2, X, SearchX } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/common/EmptyState'

export function StackCompareSearch({ paramA, paramB }: { paramA: string | null; paramB: string | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      const supabase = createClient()
      const excluded = [paramA, paramB].filter(Boolean) as string[]

      const q = supabase
        .from('collections')
        .select('id, name, share_slug, icon, view_count')
        .eq('is_public', true)
        .ilike('name', `%${query}%`)
        .limit(6)

      const { data } = excluded.length > 0
        ? await q.not('share_slug', 'in', `(${excluded.join(',')})`)
        : await q

      setResults(data ?? [])
      setLoading(false)
    }

    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [query, paramA, paramB])

  const addStack = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!paramA) {
      params.set('a', slug)
    } else {
      params.set('b', slug)
    }
    router.push(`/stacks/compare?${params.toString()}`)
    setQuery('')
    setOpen(false)
  }

  const placeholder = !paramA
    ? 'Search for first stack...'
    : !paramB
    ? 'Search for second stack to compare...'
    : 'Search to replace a stack...'

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-background border-[1.5px] border-foreground/20 rounded-md h-11 pl-10 pr-10 focus:outline-none focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-primary/5 transition-all text-sm font-medium"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (query.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-background border-[1.5px] border-foreground rounded-md shadow-[4px_4px_0_0_#000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              <p className="text-xs">Searching stacks...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-foreground/5">
              {results.map((stack) => (
                <button
                  key={stack.id}
                  onClick={() => addStack(stack.share_slug)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors text-left group"
                >
                  <div className="h-8 w-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-lg">
                    {stack.icon || '⚡'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{stack.name}</p>
                    <p className="text-[10px] text-muted-foreground">{stack.view_count || 0} views</p>
                  </div>
                  <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={SearchX}
                title="No stacks found"
                description={`No results for "${query}". Try a different search.`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
