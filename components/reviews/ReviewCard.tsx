import { StarRating } from './StarRating'
import { ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { HelpfulButton } from './HelpfulButton'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    title: string | null
    body: string | null
    is_verified: boolean
    helpful_count: number
    created_at: string
    profiles?: { display_name: string | null; avatar_url: string | null; role?: string | null } | null
  }
}

export function ReviewCard({ review }: ReviewCardProps) {
  const isSimulation = [review.title ?? '', review.body ?? '']
    .some((text) => text.toUpperCase().includes('[SIMULATION]'))

  return (
    <div className="py-4 border-t border-black/20 first:border-0 first:pt-0">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          {review.is_verified && (
            <span className="flex items-center gap-1 text-xs text-emerald-700">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
          {review.profiles?.role === 'editor' && (
            <Badge variant="outline" className="text-[10px] border-sky-300 bg-sky-100 text-sky-800">Editor</Badge>
          )}
          {isSimulation && (
            <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-100 text-amber-800">Simulation</Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>
      {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
      {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {review.profiles?.display_name ?? 'Anonymous'}
        </p>
        <HelpfulButton reviewId={review.id} initialCount={review.helpful_count} />
      </div>
    </div>
  )
}
