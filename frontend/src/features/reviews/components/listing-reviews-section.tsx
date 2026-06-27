import { Star } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useListingReviews } from '../api/reviews.api'
import { ReviewsList } from './reviews-list'

interface ListingReviewsSectionProps {
  listingId: string
}

export function ListingReviewsSection({ listingId }: ListingReviewsSectionProps) {
  const { data, isLoading, isError } = useListingReviews(listingId)
  const reviews = data?.reviews ?? []
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  return (
    <>
      <Separator />
      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-950">
              <Star className="size-5 fill-amber-500 text-amber-500" />
              Reviews
            </h2>
            <p className="text-sm text-muted-foreground">
              {data?.total
                ? `${data.total} review${data.total === 1 ? '' : 's'} from completed stays`
                : 'Feedback appears here after completed stays.'}
            </p>
          </div>
          {reviews.length > 0 && (
            <div className="rounded-xl border border-border/70 bg-white px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Average rating
              </p>
              <p className="text-xl font-bold text-slate-950">
                {average.toFixed(1)} / 5
              </p>
            </div>
          )}
        </div>

        {isError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load reviews.
          </div>
        ) : (
          <ReviewsList
            reviews={reviews}
            isLoading={isLoading}
            emptyMessage="No guest reviews yet."
          />
        )}
      </section>
    </>
  )
}
