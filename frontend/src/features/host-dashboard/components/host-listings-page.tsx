import { Link } from '@tanstack/react-router'
import {
  Home as HomeIcon,
  Plus,
  MapPin,
  Users,
  BedDouble,
  ImageOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAssetUrl } from '@/lib/api/urls'
import { useHostListings } from '../api/listings.api'
import { ListingStatus } from '../types/listing.types'
import type { Listing } from '../types/listing.types'

const STATUS_STYLES: Record<
  ListingStatus,
  { label: string; className: string }
> = {
  [ListingStatus.Draft]: {
    label: 'Draft',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  [ListingStatus.Active]: {
    label: 'Active',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  [ListingStatus.Closed]: {
    label: 'Closed',
    className: 'bg-muted text-muted-foreground border-border',
  },
}

function ListingCard({ listing }: { listing: Listing }) {
  const coverPhoto = listing.photos[0]
  const status = STATUS_STYLES[listing.status]

  return (
    <Link
      to="/host/listings/$listingId"
      params={{ listingId: listing.id }}
      className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      {/* Image */}
      <div className="aspect-[16/10] bg-muted relative overflow-hidden">
        {coverPhoto ? (
          <img
            src={getAssetUrl(coverPhoto.picture)}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="size-8" />
            <span className="text-xs">No photos</span>
          </div>
        )}

        {/* Status Badge */}
        <span
          className={`absolute top-3 right-3 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="line-clamp-1">{listing.locationText}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" /> {listing.maxGuests}
            </span>
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" /> {listing.bedrooms}
            </span>
          </div>
          <span className="text-sm font-bold text-foreground">
            ${Number(listing.price).toFixed(0)}
            <span className="text-xs font-normal text-muted-foreground">
              /night
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}

export function HostListingsPage() {
  const { data: listings, isLoading, isError } = useHostListings()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-headline-md font-bold text-foreground">
            My Listings
          </h2>
          <p className="text-body-sm text-muted-foreground">
            Manage your properties and create new listings.
          </p>
        </div>
        <Link to="/host/listings/new">
          <Button className="gap-1.5">
            <Plus className="size-4" />
            Add New Listing
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="relative size-10">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">
            Loading your listings...
          </p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="py-12 text-center text-sm text-destructive">
          Failed to load listings. Please try again.
        </div>
      )}

      {/* Listings Grid */}
      {listings && listings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {listings && listings.length === 0 && (
        <div className="py-20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center p-6 bg-card/30">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-5">
            <HomeIcon className="size-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No listings yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            You haven't created any property listings yet. Start by adding your
            first listing to begin hosting on StayMate.
          </p>
          <Link to="/host/listings/new" className="mt-6">
            <Button className="gap-1.5">
              <Plus className="size-4" />
              Create Your First Listing
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
