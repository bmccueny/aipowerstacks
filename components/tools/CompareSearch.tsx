'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

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
    const search = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('tools')
        .select('id, name, slug, tagline, logo_url')
        .ilike('name', `%${query}%`)
        .eq('status', 'published')
        .not('slug', 'in', `(${currentSlugs.join(',')})`)
        .limit(5)
      
      setResults(data ?? [])
      setLoading(false)
    }

    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [query, currentSlugs])

  const addTool = (slug: string) => {
    const newSlugs = [...currentSlugs, slug].slice(0, 3)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tools', newSlugs.join(','))
    router.push(`/compare?${params.toString()}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md mx-auto mb-8">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Add another tool to compare..."
          className="w-full bg-background border-[1.5px] border-foreground/20 rounded-md h-11 pl-10 pr-10 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
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
              <p className="text-xs">Searching tools...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-foreground/5">
              {results.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => addTool(tool.slug)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors text-left group"
                >
                  <div className="h-8 w-8 rounded bg-muted overflow-hidden flex items-center justify-center shrink-0 border border-foreground/10">
                    {tool.logo_url ? (
                      <Image src={tool.logo_url} alt={tool.name} width={32} height={32} className="object-contain" />
                    ) : (
                      <span className="text-[10px] font-bold text-primary">{tool.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{tool.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{tool.tagline}</p>
                  </div>
                  <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-xs italic">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  )
}
