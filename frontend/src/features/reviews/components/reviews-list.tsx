import { format } from 'date-fns'
import { Loader2, Star } from 'lucide-react'
import type { Review } from '../types/reviews.types'

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={
        index < rating
          ? 'size-4 fill-amber-500 text-amber-500'
          : 'size-4 text-muted-foreground/40'
      }
    />
  ))
}

function initials(name?: string | null) {
  if (!name) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function ReviewItem({ review }: { review: Review }) {
  const reviewerName = review.reviewer?.name || 'StayMate guest'

  return (
    <article className="rounded-xl border border-border/70 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {review.reviewer?.avatarUrl ? (
            <img
              src={review.reviewer.avatarUrl}
              alt={reviewerName}
              className="size-full rounded-full object-cover"
            />
          ) : (
            <span>{initials(reviewerName)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-950">{reviewerName}</h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(review.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
              {renderStars(review.rating)}
            </div>
          </div>
          {review.comment && (
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

export function ReviewsList({
  reviews,
  isLoading,
  emptyMessage,
}: {
  reviews?: Review[]
  isLoading: boolean
  emptyMessage: string
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading reviews...
      </div>
    )
  }

  if (!reviews || reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
    </div>
  )
}

