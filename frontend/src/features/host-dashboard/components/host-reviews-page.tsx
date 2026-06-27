import { MessageSquareText, Star } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ListingRatingSummary, ReviewsList, useListingReviews } from '@/features/reviews'
import { useHostListings } from '../api/listings.api'
import type { Listing } from '../types/listing.types'

function ListingReviewPanel({ listing }: { listing: Listing }) {
  const { data, isLoading, isError } = useListingReviews(listing.id, {
    limit: 5,
  })

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">{listing.title}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {listing.locationText}
          </p>
          <div className="mt-2">
            <ListingRatingSummary listingId={listing.id} />
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/host/listings/$listingId" params={{ listingId: listing.id }}>
            Manage listing
          </Link>
        </Button>
      </div>

      {isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load reviews for this listing.
        </div>
      ) : (
        <ReviewsList
          reviews={data?.reviews ?? []}
          isLoading={isLoading}
          emptyMessage="No guest reviews for this listing yet."
        />
      )}
    </section>
  )
}

export function HostReviewsPage() {
  const { data: listings, isLoading, isError } = useHostListings()

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-headline-md font-bold text-foreground">
            Reviews
          </h2>
          <p className="text-body-sm text-muted-foreground">
            See guest feedback across your active and draft listings.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Star className="size-4 fill-amber-500 text-amber-500" />
          Listing ratings update after completed stays are reviewed.
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading listing reviews...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Failed to load your listings. Please try again.
        </div>
      )}

      {listings && listings.length > 0 && (
        <div className="space-y-5">
          {listings.map((listing) => (
            <ListingReviewPanel key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {listings && listings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquareText className="size-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No listings yet</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Create a listing first. Guest reviews will appear here after completed stays.
          </p>
        </div>
      )}
    </div>
  )
}

