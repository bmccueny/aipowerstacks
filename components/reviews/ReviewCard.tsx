'use client'

import { useState } from 'react'
import Image from 'next/image'
import { StarRating } from './StarRating'
import { Pencil, Trash2, Loader2, X, Check, Star, Linkedin, Github } from 'lucide-react'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { Badge } from '@/components/ui/badge'
import { HelpfulButton } from './HelpfulButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface ReviewCardProps {
  review: {
    id: string
    user_id: string
    rating: number
    title: string | null
    body: string | null
    is_verified: boolean
    helpful_count: number
    created_at: string
    status: string
    profiles?: {
      display_name: string | null;
      avatar_url: string | null;
      username?: string | null;
      role?: string | null;
      linkedin_url?: string | null;
      github_url?: string | null;
      is_identity_verified?: boolean;
    } | null
  }
  currentUserId?: string
}

export function ReviewCard({ review, currentUserId }: ReviewCardProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editRating, setEditRating] = useState(review.rating)
  const [editHovered, setEditHovered] = useState(0)
  const [editTitle, setEditTitle] = useState(review.title || '')
  const [editBody, setEditBody] = useState(review.body || '')

  const isOwner = currentUserId === review.user_id
  const isSimulation = [review.title ?? '', review.body ?? '']
    .some((text) => text.toUpperCase().includes('[SIMULATION]'))

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${review.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Review deleted')
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete review')
      }
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: editRating,
          title: editTitle || undefined,
          body: editBody || undefined
        }),
      })
      if (res.ok) {
        toast.success('Review updated and sent for moderation')
        setIsEditing(false)
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update review')
      }
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="py-6 border-t border-foreground/20 first:border-0 first:pt-0 animate-in fade-in duration-300">
        <div className="space-y-4 bg-primary/5 p-4 rounded-md border border-primary/10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Edit Your Review</h3>
            <Button variant="ghost" size="icon-xs" onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div>
            <p className="text-xs font-medium mb-2 uppercase tracking-wider text-muted-foreground">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onMouseEnter={() => setEditHovered(star)}
                  onMouseLeave={() => setEditHovered(0)}
                  onClick={() => setEditRating(star)}
                >
                  <Star className={cn(
                    'h-5 w-5 transition-colors',
                    star <= (editHovered || editRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-foreground/15 text-foreground/15'
                  )} />
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">Title</label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Brief summary"
              className="glass-card border-border/30 h-10 text-sm focus-visible:ring-2 focus-visible:ring-primary/50"
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">Review</label>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              placeholder="Share your experience..."
              className="w-full glass-card border border-border/30 rounded-2xl px-4 py-3 text-sm resize-none h-28 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              maxLength={1000}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={loading}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdate} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 border-t border-foreground/20 first:border-0 first:pt-0 group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          {review.status === 'pending' && (
            <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-100 text-amber-800">Pending Approval</Badge>
          )}
          {review.status === 'rejected' && (
            <Badge variant="outline" className="text-[10px] border-red-300 bg-red-100 text-red-800">Rejected</Badge>
          )}
          {isSimulation && (
            <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-100 text-amber-800">Simulation</Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isOwner && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsEditing(true)}
                className="p-1 text-muted-foreground hover:text-primary transition-colors"
                title="Edit review"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleDelete}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                disabled={loading}
                title="Delete review"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}
          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(review.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
      {review.body && <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border-[1.5px] border-primary/20 shadow-sm">
            <AvatarImage src={review.profiles?.avatar_url ?? undefined} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
              {(review.profiles?.display_name ?? 'A')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-none">Reviewer</span>
            </div>
            <div className="flex items-center gap-2">
              {review.profiles?.username ? (
                <a href={`/curators/${review.profiles.username}`} className="text-sm font-bold text-foreground leading-tight hover:text-primary transition-colors">
                  {review.profiles.display_name ?? 'Anonymous'}
                </a>
              ) : (
                <p className="text-sm font-bold text-foreground leading-tight">
                  {review.profiles?.display_name ?? 'Anonymous'}
                </p>
              )}
              <div className="flex items-center gap-1.5">
                {review.profiles?.linkedin_url && (
                  <a href={review.profiles.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#0077b5] transition-colors">
                    <Linkedin className="h-3 w-3" />
                  </a>
                )}
                {review.profiles?.github_url && (
                  <a href={review.profiles.github_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        <HelpfulButton reviewId={review.id} initialCount={review.helpful_count} />
      </div>
    </div>
  )
}
