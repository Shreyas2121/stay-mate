import { Star } from 'lucide-react'
import { useListingReviews } from '../api/reviews.api'

export function useListingReviewSummary(listingId: string) {
  const query = useListingReviews(listingId, { limit: 100 })
  const reviews = query.data?.reviews ?? []
  const reviewCount = query.data?.total ?? 0
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null

  return {
    ...query,
    reviewCount,
    averageRating,
  }
}

export function ListingRatingSummary({
  listingId,
  compact = false,
  emptyLabel = 'New',
}: {
  listingId: string
  compact?: boolean
  emptyLabel?: string
}) {
  const { averageRating, reviewCount, isLoading } = useListingReviewSummary(listingId)

  if (isLoading) {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-slate-500">
        <Star className="size-3.5" />
        ...
      </span>
    )
  }

  if (!averageRating || reviewCount === 0) {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-slate-500">
        <Star className="size-3.5" />
        {emptyLabel}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
      <Star className="size-3.5 fill-current text-amber-500" />
      <span>{averageRating.toFixed(1)}</span>
      {!compact && (
        <span className="text-muted-foreground">
          ({reviewCount} review{reviewCount === 1 ? '' : 's'})
        </span>
      )}
    </span>
  )
}
