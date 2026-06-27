import { Link } from '@tanstack/react-router'
import { AlertTriangle, BedDouble, Home, ImageOff, Loader2, MapPin, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAssetUrl } from '@/lib/api/urls'
import {
  useAdminHost,
  useAdminHostListings,
  useReactivateHost,
  useTerminateHost,
} from '../api/admin.api'
import type { AdminHost } from '../types/admin.types'
import type { Listing } from '@/features/host-dashboard/types/listing.types'

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function ListingCard({ listing }: { listing: Listing & { bookingCount?: number } }) {
  const coverPhoto = listing.photos?.[0]

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="aspect-[16/9] bg-muted">
        {coverPhoto ? (
          <img
            src={getAssetUrl(coverPhoto.picture)}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="size-8" />
            <span className="text-xs">No photo</span>
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-foreground line-clamp-1">
              {listing.title}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              <span className="line-clamp-1">{listing.locationText}</span>
            </p>
          </div>
          <Badge variant={listing.status === 'active' ? 'secondary' : 'outline'} className="capitalize">
            {listing.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {listing.maxGuests}
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="size-3.5" />
            {listing.bedrooms}
          </span>
          <span>{formatMoney(listing.price)}/night</span>
          <span>{listing.bookingCount ?? 0} bookings</span>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link
            to="/admin/listings/$listingId/bookings"
            params={{ listingId: listing.id }}
          >
            View Listing Trips
          </Link>
        </Button>
      </div>
    </article>
  )
}

export function AdminHostDetailPage({ hostId }: { hostId: string }) {
  const { data: host, isLoading: isHostLoading, isError: isHostError } = useAdminHost(hostId)
  const { data: listings = [], isLoading: areListingsLoading } = useAdminHostListings(hostId)
  const terminateMutation = useTerminateHost()
  const reactivateMutation = useReactivateHost()

  const handleTerminate = (targetHost: AdminHost) => {
    if (
      window.confirm(
        `Terminate ${targetHost.name || targetHost.email}? This closes their listings and cancels pending bookings.`,
      )
    ) {
      terminateMutation.mutate(targetHost.id)
    }
  }

  const handleReactivate = (targetHost: AdminHost) => {
    if (
      window.confirm(
        `Reactivate ${targetHost.name || targetHost.email}? Closed listings will stay closed.`,
      )
    ) {
      reactivateMutation.mutate(targetHost.id)
    }
  }

  if (isHostLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading host...
      </div>
    )
  }

  if (isHostError || !host) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
        <AlertTriangle className="mx-auto mb-2 size-8" />
        Failed to load host.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Button asChild variant="ghost" className="-ml-4 mb-3">
            <Link to="/admin/hosts">Back to Hosts</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-headline-md font-bold text-foreground">
              {host.name || host.email}
            </h2>
            <Badge variant={host.isActive ? 'secondary' : 'destructive'}>
              {host.isActive ? 'Active' : 'Terminated'}
            </Badge>
          </div>
          <p className="text-body-sm text-muted-foreground">{host.email}</p>
        </div>
        {host.isActive ? (
          <Button
            variant="destructive"
            disabled={terminateMutation.isPending}
            onClick={() => handleTerminate(host)}
          >
            Terminate Host
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={reactivateMutation.isPending}
            onClick={() => handleReactivate(host)}
          >
            Reactivate Host
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Listings
          </p>
          <p className="mt-1 text-2xl font-bold">{host.listingCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active
          </p>
          <p className="mt-1 text-2xl font-bold">{host.activeListingCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Bookings
          </p>
          <p className="mt-1 text-2xl font-bold">{host.bookingCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Host Net
          </p>
          <p className="mt-1 text-2xl font-bold">
            {formatMoney(host.hostAmountTotal ?? 0)}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Listings</h3>
          <p className="text-sm text-muted-foreground">
            Admin-visible inventory for this host, including closed listings.
          </p>
        </div>
        {areListingsLoading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading listings...
          </div>
        ) : listings.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
            <Home className="mb-3 size-8 text-muted-foreground" />
            <h4 className="font-bold text-foreground">No listings</h4>
          </div>
        )}
      </section>
    </div>
  )
}
