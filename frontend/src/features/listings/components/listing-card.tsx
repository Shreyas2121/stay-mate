import { Link } from '@tanstack/react-router'
import { ImageOff } from 'lucide-react'
import type { Listing } from '@/features/host-dashboard/types/listing.types'
import { getAssetUrl } from '@/lib/api/urls'
import { ListingRatingSummary } from '@/features/reviews'
import { WishlistButton } from '@/features/wishlists'

interface ListingCardProps {
  listing: Listing
}

export function ListingCard({ listing }: ListingCardProps) {
  const coverPhoto = listing.photos?.[0]

  // Extract City, State from potential full address (e.g. "123 Main St, Chicago, IL")
  const locationParts = listing.locationText.split(',')
  const locationDisplay = locationParts.slice(-2).join(',').trim() || listing.locationText

  return (
    <Link
      to="/listings/$listingId"
      params={{ listingId: listing.id }}
      className="group flex flex-col gap-3 cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-[20/19] overflow-hidden rounded-xl bg-slate-100">
        {coverPhoto ? (
          <img
            src={getAssetUrl(coverPhoto.picture)}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <ImageOff className="size-8 opacity-50" />
            <span className="text-sm font-medium">No photo available</span>
          </div>
        )}
        <WishlistButton listingId={listing.id} variant="overlay" />
      </div>

      {/* Details Container */}
      <div className="flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-slate-900 truncate">
            {listing.title}
          </h3>
          <div className="shrink-0">
            <ListingRatingSummary listingId={listing.id} compact />
          </div>
        </div>

        <p className="text-sm text-slate-500 truncate mt-0.5">
          {locationDisplay}
        </p>
        <p className="text-sm text-slate-500 mt-0.5">
          {listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''} Â· {listing.maxGuests} guest{listing.maxGuests !== 1 ? 's' : ''}
        </p>

        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-semibold text-slate-900">${Number(listing.price).toFixed(0)}</span>
          <span className="text-sm text-slate-500">/night</span>
        </div>
      </div>
    </Link>
  )
}

