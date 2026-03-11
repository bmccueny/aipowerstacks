'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const supabase = createClient()

export function CompareSearch({ currentSlugs }: { currentSlugs: string[] }) {
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
    let cancelled = false
    const search = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      let builder = supabase
        .from('tools')
        .select('id, name, slug, tagline, logo_url')
        .ilike('name', `%${query}%`)
        .eq('status', 'published')
      if (currentSlugs.length > 0) {
        builder = builder.not('slug', 'in', `(${currentSlugs.join(',')})`)
      }
      const { data } = await builder.limit(5)
      if (!cancelled) {
        setResults(data ?? [])
        setLoading(false)
      }
    }

    const timer = setTimeout(search, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentSlugs.join(',')])

  const addTool = (slug: string) => {
    const newSlugs = [...currentSlugs, slug].slice(0, 3)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tools', newSlugs.join(','))
    router.push(`/compare?${params.toString()}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full mb-4">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search tools to add..."
          className="w-full bg-background border-[1.5px] border-foreground/10 rounded-xl h-12 pl-11 pr-10 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold shadow-sm"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 z-40 mt-3 bg-background border border-foreground/10 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.3)] overflow-visible animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-2xl lg:min-w-[500px]">
          <div className="overflow-hidden rounded-2xl border border-foreground/5 bg-background/95">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
                <p className="text-xs font-black uppercase tracking-widest opacity-50">Scanning Database</p>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-foreground/5 p-2">
                {results.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => addTool(tool.slug)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-primary/5 transition-all text-left group rounded-xl"
                  >
                    <div className="h-10 w-10 rounded-2xl glass-card overflow-hidden flex items-center justify-center shrink-0 border border-border/30 shadow-lg group-hover:border-primary/40 transition-all duration-300">
                      {tool.logo_url ? (
                        <img src={tool.logo_url} alt={tool.name} className="object-contain p-1" />
                      ) : (
                        <span className="text-xs font-black text-primary uppercase">{tool.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate group-hover:text-primary transition-colors leading-tight mb-0.5">{tool.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate leading-none uppercase tracking-tighter opacity-70">{tool.tagline}</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-xs font-bold italic opacity-50">No tools found matching &quot;{query}&quot;</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
