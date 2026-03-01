'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  toolId: string
  onSuccess?: () => void
}

export function ReviewForm({ toolId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { setError('Please select a rating'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId, rating, title: title || undefined, body: body || undefined }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
    } else {
      setSubmitted(true)
      onSuccess?.()
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Thanks for your review. It&apos;s pending editorial approval.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Your Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
            >
              <Star className={cn(
                'h-6 w-6 transition-colors',
                star <= (hovered || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-foreground/15 text-foreground/15'
              )} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Title (optional)</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary"
          className="bg-background border-black/20"
          maxLength={100}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Review (optional)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your experience..."
          className="w-full bg-background border border-black/20 rounded-lg px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:border-primary/50"
          maxLength={1000}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} size="sm">
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
