import { Link } from '@tanstack/react-router'
import { AlertTriangle, Loader2, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookingCard } from '@/features/bookings/components/booking-card'
import { BookingsListPage } from '@/features/bookings'
import {
  useAdminListing,
  useAdminListingBookings,
} from '../api/admin.api'

export function AdminListingBookingsPage({
  listingId,
}: {
  listingId: string
}) {
  const { data: listing, isLoading: isListingLoading, isError: isListingError } =
    useAdminListing(listingId)
  const {
    data: bookings,
    isLoading: areBookingsLoading,
    isError: areBookingsError,
  } = useAdminListingBookings(listingId)

  if (isListingLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading listing...
      </div>
    )
  }

  if (isListingError || !listing) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
        <AlertTriangle className="mx-auto mb-2 size-8" />
        Failed to load listing.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" className="-ml-4 mb-3">
          <Link to="/admin/hosts">Back to Hosts</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-headline-md font-bold text-foreground">
            {listing.title}
          </h2>
          <Badge variant={listing.status === 'active' ? 'secondary' : 'outline'} className="capitalize">
            {listing.status}
          </Badge>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          {listing.locationText}
        </p>
      </div>

      <BookingsListPage
        title="Listing Trips"
        description="All bookings attached to this listing, visible to admins for audit and moderation."
        emptyTitle="No bookings for this listing"
        emptyDescription="Bookings will appear here after guests create checkout sessions for this listing."
        mode="admin"
        bookings={bookings}
        isLoading={areBookingsLoading}
        isError={areBookingsError}
      />
    </div>
  )
}
