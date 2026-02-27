import { StarRating } from './StarRating'
import { ShieldCheck } from 'lucide-react'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    title: string | null
    body: string | null
    is_verified: boolean
    created_at: string
    profiles?: { display_name: string | null; avatar_url: string | null } | null
  }
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="py-4 border-t border-white/10 first:border-0 first:pt-0">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          {review.is_verified && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>
      {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
      {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
      <p className="text-xs text-muted-foreground mt-2">
        {review.profiles?.display_name ?? 'Anonymous'}
      </p>
    </div>
  )
}
