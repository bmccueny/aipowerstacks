'use client'

import { useState, type ComponentProps } from 'react'
import { ReviewCard } from './ReviewCard'

type ReviewItem = ComponentProps<typeof ReviewCard>['review']
type SortOption = 'helpful' | 'newest' | 'highest' | 'lowest'

export function ReviewList({ reviews, currentUserId }: { reviews: ReviewItem[]; currentUserId?: string }) {
  const [sort, setSort] = useState<SortOption>('helpful')
  const [filterRating, setFilterRating] = useState<number | null>(null)

  const filtered = filterRating
    ? reviews.filter(r => r.rating === filterRating)
    : reviews

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'highest': return b.rating - a.rating
      case 'lowest': return a.rating - b.rating
      case 'helpful':
      default: return (b.helpful_count ?? 0) - (a.helpful_count ?? 0)
    }
  })

  if (reviews.length === 0) return null

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="text-xs font-medium bg-muted/50 border border-foreground/10 rounded-lg px-2.5 py-1.5 text-foreground"
        >
          <option value="helpful">Most Helpful</option>
          <option value="newest">Newest</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setFilterRating(null)}
            className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
              filterRating === null ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length
            if (count === 0) return null
            return (
              <button
                key={star}
                onClick={() => setFilterRating(filterRating === star ? null : star)}
                className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
                  filterRating === star ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {star}★ ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Reviews */}
      <div>
        {sorted.map((review) => (
          <ReviewCard key={review.id} review={review} currentUserId={currentUserId} />
        ))}
        {sorted.length === 0 && filterRating && (
          <p className="text-sm text-muted-foreground py-4">No {filterRating}-star reviews yet.</p>
        )}
      </div>
    </div>
  )
}
