'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'compare_tools'

export interface CompareItem {
  slug: string
  name: string
}

interface CompareContextValue {
  items: CompareItem[]
  add: (slug: string, name: string) => void
  remove: (slug: string) => void
  clear: () => void
  has: (slug: string) => boolean
}

const CompareContext = createContext<CompareContextValue | null>(null)

function readStored(): CompareItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((v): v is CompareItem => typeof v?.slug === 'string' && typeof v?.name === 'string')
      : []
  } catch {
    return []
  }
}

function writeStored(items: CompareItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 3)))
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([])

  useEffect(() => {
    setItems(readStored())
  }, [])

  const add = useCallback((slug: string, name: string) => {
    setItems(prev => {
      const next = [{ slug, name }, ...prev.filter(i => i.slug !== slug)].slice(0, 3)
      writeStored(next)
      return next
    })
  }, [])

  const remove = useCallback((slug: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.slug !== slug)
      writeStored(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
    writeStored([])
  }, [])

  const has = useCallback((slug: string) => items.some(i => i.slug === slug), [items])

  return (
    <CompareContext.Provider value={{ items, add, remove, clear, has }}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within CompareProvider')
  return ctx
}
