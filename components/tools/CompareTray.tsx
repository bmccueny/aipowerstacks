'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeftRight, X } from 'lucide-react'
import { useCompare } from '@/lib/context/CompareContext'
import { cn } from '@/lib/utils'

export function CompareTray() {
  const { items, remove, clear } = useCompare()
  const router = useRouter()
  const pathname = usePathname()

  if (pathname?.startsWith('/compare')) return null
  if (items.length === 0) return null

  const compareHref = `/compare?tools=${encodeURIComponent(items.map(i => i.slug).join(','))}`

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Blur backdrop behind compare tray */}
      <div
        className="absolute inset-x-0 bottom-0 h-[calc(100%+2rem)] bg-black/15 backdrop-blur-md pointer-events-none"
        style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 2rem)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 2rem)' }}
        aria-hidden="true"
      />
      <div className="relative border-t border-white/20 liquid-glass px-4 py-4 flex items-center gap-3">
        <ArrowLeftRight className="h-4 w-4 shrink-0 text-white/50" />
        <span className="text-xs font-black uppercase tracking-widest text-white/50 shrink-0 hidden sm:block">
          Compare
        </span>

        <div className="flex items-center gap-2 flex-1 overflow-x-auto min-w-0">
          {items.map(item => (
            <span
              key={item.slug}
              className="flex items-center gap-1.5 glass-card border border-border/30 rounded-xl px-3 py-1.5 text-sm font-bold whitespace-nowrap shrink-0 transition-all duration-300"
            >
              {item.name}
              <button
                onClick={() => remove(item.slug)}
                className="text-white/40 hover:text-white transition-colors"
                aria-label={`Remove ${item.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {Array.from({ length: 4 - items.length }).map((_, i) => (
            <span
              key={`empty-${i}`}
              className={cn(
                'border border-dashed border-white/15 rounded-xl px-2.5 py-1 text-sm font-bold text-white/20 whitespace-nowrap shrink-0',
                'hidden sm:block'
              )}
            >
              + Add tool
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {items.length >= 2 && (
            <button
              onClick={() => router.push(compareHref)}
              className="h-9 px-4 bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-colors rounded-xl whitespace-nowrap"
            >
              Compare Now →
            </button>
          )}
          <button
            onClick={clear}
            className="h-9 w-9 flex items-center justify-center text-white/40 hover:text-white transition-colors shrink-0"
            title="Clear all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
