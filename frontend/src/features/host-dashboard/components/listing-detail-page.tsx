import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

import type { CreateListingForm } from '../types/listing.types'
import { ListingStatus } from '../types/listing.types'
import { useListingDetail, useUpdateListing } from '../api/listings.api'
import { ListingForm } from './create-listing/listing-form'
import type { ListingFormMode } from './create-listing/listing-form'
import { ListingAvailabilitySection } from './listing-availability-section'

interface Props {
  listingId: string
}

export function ListingDetailPage({ listingId }: Props) {
  const navigate = useNavigate()
  const { data: listing, isLoading, isError } = useListingDetail(listingId)
  const updateMutation = useUpdateListing()

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="relative size-10">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Loading listing...</p>
      </div>
    )
  }

  if (isError || !listing) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm text-destructive">Failed to load listing.</p>
        <Link to="/host/listings">
          <Button variant="outline" size="sm">
            Back to Listings
          </Button>
        </Link>
      </div>
    )
  }

  // Map server listing to form defaults
  const defaultValues: CreateListingForm = {
    title: listing.title,
    description: listing.description,
    price: Number(listing.price),
    locationText: listing.locationText,
    latitude: Number(listing.latitude),
    longitude: Number(listing.longitude),
    maxGuests: listing.maxGuests,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    cleaningFee: Number(listing.cleaningFee),
    propertyType: listing.propertyType,
    minNights: listing.minNights,
    maxNights: listing.maxNights,
    checkInTime: listing.checkInTime,
    checkOutTime: listing.checkOutTime,
    additionalInfo: listing.additionalInfo ?? '',
    amenityIds: listing.amenities.filter((a) => a.isSystem).map((a) => a.id),
    customAmenities: listing.amenities
      .filter((a) => !a.isSystem)
      .map((a) => a.name),
  }

  const mode: ListingFormMode =
    listing.status === ListingStatus.Draft ? 'edit-draft' : 'edit-active'

  const handleSubmit = (
    data: CreateListingForm,
    status: ListingStatus,
    newPhotos: File[],
    deletedPhotoIds: string[],
  ) => {
    updateMutation.mutate(
      {
        id: listingId,
        formData: data,
        status,
        newPhotos,
        deletedPhotoIds,
      },
      {
        onSuccess: () => {
          // Stay on the same page — the query will refetch
          void navigate({
            to: '/host/listings/$listingId',
            params: { listingId },
          })
        },
      },
    )
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/host/listings">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-headline-md font-bold text-foreground">
            {listing.title}
          </h2>
          <p className="text-body-sm text-muted-foreground">
            {listing.status === ListingStatus.Draft
              ? 'This listing is saved as a draft. Publish it to make it visible.'
              : 'Edit your listing details below.'}
          </p>
        </div>
      </div>

      <ListingForm
        key={listing.updatedAt}
        mode={mode}
        defaultValues={defaultValues}
        existingPhotos={listing.photos}
        onSubmit={handleSubmit}
        isPending={updateMutation.isPending}
        error={updateMutation.error}
      />

      <ListingAvailabilitySection listingId={listingId} />
    </div>
  )
}
