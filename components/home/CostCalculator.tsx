'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DollarSign } from 'lucide-react'

type QuickTool = {
  name: string
  logo: string | null
  price: number
  slug: string
}

const QUICK_TOOLS: QuickTool[] = [
  { name: 'ChatGPT', logo: 'https://www.google.com/s2/favicons?domain=chatgpt.com&sz=64', price: 20, slug: 'chatgpt' },
  { name: 'Claude', logo: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=64', price: 20, slug: 'claude-code' },
  { name: 'Cursor', logo: 'https://www.google.com/s2/favicons?domain=cursor.com&sz=64', price: 20, slug: 'cursor-editor' },
  { name: 'Midjourney', logo: 'https://www.google.com/s2/favicons?domain=midjourney.com&sz=64', price: 30, slug: 'midjourney-v7' },
  { name: 'Copilot', logo: 'https://www.google.com/s2/favicons?domain=github.com&sz=64', price: 10, slug: 'github-copilot' },
  { name: 'Perplexity', logo: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64', price: 20, slug: 'perplexity-ai' },
  { name: 'Zapier', logo: 'https://www.google.com/s2/favicons?domain=zapier.com&sz=64', price: 20, slug: 'zapier' },
  { name: 'Notion AI', logo: 'https://www.google.com/s2/favicons?domain=notion.com&sz=64', price: 10, slug: 'notion-ai' },
  { name: 'Grammarly', logo: 'https://www.google.com/s2/favicons?domain=grammarly.com&sz=64', price: 12, slug: 'grammarly' },
  { name: 'Canva', logo: 'https://www.google.com/s2/favicons?domain=canva.com&sz=64', price: 13, slug: 'canva' },
]

export function CostCalculator() {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (slug: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const total = QUICK_TOOLS.filter(t => selected.has(t.slug)).reduce((sum, t) => sum + t.price, 0)
  const yearly = total * 12

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tool grid */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {QUICK_TOOLS.map(tool => {
          const active = selected.has(tool.slug)
          return (
            <button
              key={tool.slug}
              type="button"
              onClick={() => toggle(tool.slug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-foreground/[0.08] bg-background/60 text-muted-foreground hover:border-foreground/20 hover:text-foreground'
              }`}
            >
              {tool.logo && <img src={tool.logo} alt="" className="w-5 h-5 rounded" />}
              <span>{tool.name}</span>
              <span className={`text-xs ${active ? 'text-primary' : 'text-muted-foreground/60'}`}>${tool.price}</span>
            </button>
          )
        })}
      </div>

      {/* Running total */}
      <div className={`rounded-2xl border p-6 text-center transition-all ${
        total > 0
          ? 'border-primary/20 bg-primary/[0.03]'
          : 'border-foreground/[0.06] bg-background/40'
      }`}>
        {total > 0 ? (
          <>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Your monthly AI spend</p>
            <p className="text-4xl sm:text-5xl font-black text-foreground">${total}<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
            <p className="text-sm text-muted-foreground mt-1">${yearly}/year across {selected.size} tool{selected.size !== 1 ? 's' : ''}</p>
          </>
        ) : (
          <>
            <DollarSign className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Tap the tools you pay for</p>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={total > 0 ? '/login?redirectTo=/tracker' : '/tracker'}
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <DollarSign className="h-4 w-4" />
          {total > 0 ? 'Save & Track Over Time' : 'Start Tracking'}
        </Link>
        <Link
          href="/tools"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          or browse all tools →
        </Link>
      </div>
    </div>
  )
}
