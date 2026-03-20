'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Loader2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MAX_TOOLS = 4

interface CompareToolSearchProps {
  currentSlugs: string[]
}

export function CompareToolSearch({ currentSlugs }: CompareToolSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ id: string; name: string; slug: string; logo_url: string | null }[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    let builder = supabase
      .from('tools')
      .select('id, name, slug, logo_url')
      .ilike('name', `%${q}%`)
      .eq('status', 'published')
    if (currentSlugs.length > 0) {
      builder = builder.not('slug', 'in', `(${currentSlugs.join(',')})`)
    }
    const { data } = await builder.limit(5)
    setResults(data ?? [])
    setLoading(false)
  }, [currentSlugs, supabase])

  const onInput = (val: string) => {
    setQuery(val)
    setOpen(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(val), 300)
  }

  const addTool = (slug: string) => {
    const newSlugs = [...currentSlugs, slug].slice(0, MAX_TOOLS)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tools', newSlugs.join(','))
    router.push(`/compare?${params.toString()}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => onInput(e.target.value)}
          onFocus={() => { if (query.length >= 2) setOpen(true) }}
          placeholder="Search..."
          className="w-full h-8 pl-7 pr-2 text-[11px] font-bold bg-background border border-foreground/15 rounded-md focus:outline-none focus-visible:border-primary/50 transition-all"
        />
      </div>
      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-foreground/10 rounded-lg shadow-xl z-[60] max-h-48 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center"><Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-primary" /></div>
          ) : results.length > 0 ? (
            <div className="p-1">
              {results.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => addTool(tool.slug)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-primary/5 rounded text-left transition-colors"
                >
                  <div className="relative h-6 w-6 rounded bg-white border border-foreground/5 overflow-hidden flex items-center justify-center shrink-0">
                    {tool.logo_url ? (
                      <Image src={tool.logo_url} alt={tool.name} fill className="object-contain p-0.5" />
                    ) : (
                      <span className="text-[8px] font-black text-primary">{tool.name[0]}</span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold truncate flex-1">{tool.name}</span>
                  <Plus className="h-3 w-3 text-primary shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2 text-center text-[10px] text-muted-foreground">No results</div>
          )}
        </div>
      )}
    </div>
  )
}
