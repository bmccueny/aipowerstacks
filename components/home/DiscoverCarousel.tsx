'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Star, Layers, Zap } from 'lucide-react'
import type { FeedItem } from './DiscoverFeed'

const iconMap = {
  tool: Zap,
  review: Star,
  stack: Layers,
}

const colorMap: Record<string, string> = {
  new_tool: 'text-emerald-500',
  new_review: 'text-amber-500',
  trending_stack: 'text-primary',
}

const labelMap: Record<string, string> = {
  new_tool: 'New Tool',
  new_review: 'Review',
  trending_stack: 'Trending Stack',
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function FeedCard({ item }: { item: FeedItem }) {
  const Icon = iconMap[item.icon]
  return (
    <Link
      href={item.href}
      className="shrink-0 w-[220px] glass-card rounded-xl p-4 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-3.5 w-3.5 ${colorMap[item.type]}`} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {labelMap[item.type]}
        </span>
      </div>
      <p className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
        {item.title}
      </p>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.subtitle}</p>
      <p className="text-[10px] text-muted-foreground/60 mt-2">{timeAgo(item.time)}</p>
    </Link>
  )
}

export function DiscoverCarousel({ items }: { items: FeedItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let animationId: number
    let position = 0
    // Each card is 220px + 12px gap
    const cardWidth = 232
    const singleSetWidth = items.length * cardWidth

    function step() {
      if (!paused) {
        position -= 0.5
        // Reset seamlessly when the first set has scrolled out
        if (Math.abs(position) >= singleSetWidth) {
          position += singleSetWidth
        }
        if (track) {
          track.style.transform = `translateX(${position}px)`
        }
      }
      animationId = requestAnimationFrame(step)
    }

    animationId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationId)
  }, [paused, items.length])

  // Duplicate items for seamless looping
  const doubled = [...items, ...items]

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-background to-transparent" />

      <div ref={trackRef} className="flex gap-3 py-1 will-change-transform">
        {doubled.map((item, i) => (
          <FeedCard key={`${item.id}-${i}`} item={item} />
        ))}
      </div>
    </div>
  )
}
