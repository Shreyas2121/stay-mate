import { Link } from '@tanstack/react-router'
import { Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListingCard } from '@/features/listings/components/listing-card'
import { useMyWishlist } from '../api/wishlists.api'

export function SavedListingsPage() {
  const { data: wishlistItems, isLoading, isError } = useMyWishlist()
  const listings = wishlistItems?.map((item) => item.listing) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Saved Listings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep track of stays you want to revisit before booking.
        </p>
      </div>

      {isLoading && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading saved listings...
          </p>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-sm font-medium text-destructive">
          Failed to load your saved listings. Please try again.
        </div>
      )}

      {!isLoading && !isError && listings.length === 0 && (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="size-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No saved listings yet
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Tap the heart on any stay to save it here for later comparison.
          </p>
          <Button asChild className="mt-5">
            <Link to="/listings">Browse stays</Link>
          </Button>
        </div>
      )}

      {listings.length > 0 && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
