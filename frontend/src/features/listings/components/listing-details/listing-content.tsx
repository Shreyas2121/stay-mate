import { useMemo } from 'react'
import { format } from 'date-fns'
import {
  Bath,
  BedDouble,
  CalendarDays,
  Clock,
  Heart,
  Home,
  Info,
  MapPin,
  Share2,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListingRatingSummary, ListingReviewsSection } from '@/features/reviews'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Listing } from '../../types/listings.types'
import { BookingCard } from './booking-card'
import { PhotoGallery } from './photo-gallery'
import {
  formatPropertyType,
  getLocationSummary,
  groupAmenities,
  formatMoney,
} from './utils'

export function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-white px-4 py-3">
      <Icon className="size-5 text-primary" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

export function ListingContent({
  listing,
  isAuthenticated,
}: {
  listing: Listing
  isAuthenticated: boolean
}) {
  const amenityGroups = useMemo(
    () => groupAmenities(listing.amenities || []),
    [listing.amenities],
  )

  return (
    <>
      <section className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {formatPropertyType(listing.propertyType)}
              </Badge>
              <ListingRatingSummary listingId={listing.id} />
            </div>
            <h1 className="max-w-4xl text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
              {listing.title}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-base text-slate-600">
              <MapPin className="size-4 shrink-0" />
              {getLocationSummary(listing.locationText)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 rounded-full">
              <Share2 className="size-4" />
              Share
            </Button>
            <Button variant="outline" className="gap-2 rounded-full">
              <Heart className="size-4" />
              Save
            </Button>
          </div>
        </div>

        <PhotoGallery listing={listing} />
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <DetailItem
              icon={Users}
              label="Guests"
              value={`${listing.maxGuests} max`}
            />
            <DetailItem
              icon={BedDouble}
              label="Bedrooms"
              value={`${listing.bedrooms}`}
            />
            <DetailItem
              icon={Bath}
              label="Bathrooms"
              value={`${listing.bathrooms}`}
            />
            <DetailItem
              icon={Home}
              label="Type"
              value={formatPropertyType(listing.propertyType)}
            />
          </div>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-950">
              About this stay
            </h2>
            <p className="whitespace-pre-line text-base leading-8 text-slate-700">
              {listing.description}
            </p>
          </section>

          <Separator />

          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-950">
              What this place offers
            </h2>
            {Object.keys(amenityGroups).length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(amenityGroups).map(([category, amenities]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="font-semibold text-slate-900">{category}</h3>
                    <div className="grid gap-3">
                      {amenities.map((amenity) => (
                        <div
                          key={amenity.id}
                          className="flex items-center gap-3 text-slate-700"
                        >
                          <Sparkles className="size-4 text-primary" />
                          <span>{amenity.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No amenities have been listed yet.
              </p>
            )}
          </section>

          <Separator />

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-950">
                <CalendarDays className="size-5 text-primary" />
                Stay rules
              </h2>
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  Minimum stay:{' '}
                  <span className="font-semibold">{listing.minNights}</span>{' '}
                  night{listing.minNights !== 1 ? 's' : ''}
                </p>
                <p>
                  Maximum stay:{' '}
                  <span className="font-semibold">{listing.maxNights}</span>{' '}
                  night{listing.maxNights !== 1 ? 's' : ''}
                </p>
                <p>
                  Cleaning fee:{' '}
                  <span className="font-semibold">
                    {formatMoney(listing.cleaningFee)}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-950">
                <Clock className="size-5 text-primary" />
                Check-in details
              </h2>
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  Check-in:{' '}
                  <span className="font-semibold">{listing.checkInTime}</span>
                </p>
                <p>
                  Check-out:{' '}
                  <span className="font-semibold">{listing.checkOutTime}</span>
                </p>
                <p>
                  Listed since:{' '}
                  <span className="font-semibold">
                    {format(new Date(listing.createdAt), 'MMM d, yyyy')}
                  </span>
                </p>
              </div>
            </div>
          </section>

          {listing.additionalInfo && (
            <>
              <Separator />
              <section className="rounded-2xl border border-border/70 bg-white p-5">
                <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-slate-950">
                  <Info className="size-5 text-primary" />
                  Additional information
                </h2>
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                  {listing.additionalInfo}
                </p>
              </section>
            </>
          )}

          <ListingReviewsSection listingId={listing.id} />

          <Separator />

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-950">Location</h2>
            <div className="rounded-2xl border border-border/70 bg-white p-5">
              <p className="flex items-start gap-2 text-slate-700">
                <MapPin className="mt-1 size-4 shrink-0 text-primary" />
                {listing.locationText}
              </p>
              {listing.latitude !== 0 && listing.longitude !== 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Coordinates: {listing.latitude.toFixed(5)},{' '}
                  {listing.longitude.toFixed(5)}
                </p>
              )}
            </div>
          </section>
        </div>

        <BookingCard listing={listing} isAuthenticated={isAuthenticated} />
      </section>
    </>
  )
}


