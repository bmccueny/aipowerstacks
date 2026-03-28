'use client'

import Image from 'next/image'
import { Plus } from 'lucide-react'

type PopularTool = {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

type TrackerPopularToolsProps = {
  popularTools: PopularTool[]
  alreadyTracked: Set<string>
  onQuickAdd: (tool: PopularTool) => void
}

export function TrackerPopularTools({ popularTools, alreadyTracked, onQuickAdd }: TrackerPopularToolsProps) {
  const available = popularTools.filter(t => !alreadyTracked.has(t.id)).slice(0, 12)
  if (available.length === 0) return null

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Popular tools — tap to add</p>
      <div className="flex flex-wrap gap-1.5">
        {available.map(t => (
          <button
            key={t.id}
            onClick={() => onQuickAdd(t)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-foreground/10 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-semibold"
          >
            {t.logo_url ? (
              <Image src={t.logo_url} alt={t.name} width={16} height={16} className="w-4 h-4 rounded object-contain" unoptimized />
            ) : (
              <span className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">{t.name[0]}</span>
            )}
            {t.name}
            <Plus className="h-2.5 w-2.5 text-primary opacity-50" />
          </button>
        ))}
      </div>
    </div>
  )
}
