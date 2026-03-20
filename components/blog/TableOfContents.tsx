'use client'

import { useEffect, useState } from 'react'

type Heading = { id: string; text: string; level: number }

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const els = document.querySelectorAll('.prose-editorial h2[id], .prose-editorial h3[id]')
    const items: Heading[] = Array.from(els).map((el) => ({
      id: el.id,
      text: el.textContent ?? '',
      level: el.tagName === 'H2' ? 2 : 3,
    }))
    setHeadings(items)

    if (items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    )

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  if (headings.length === 0) return null

  return (
    <nav aria-label="Table of contents">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
        On this page
      </p>
      <div className="flex flex-col gap-0.5">
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={`toc-link${h.level === 3 ? ' toc-link--h3' : ''}${activeId === h.id ? ' toc-link--active' : ''}`}
          >
            {h.text}
          </a>
        ))}
      </div>
    </nav>
  )
}
