import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

import type { CreateListingForm, ListingStatus } from '../types/listing.types'
import { useCreateListing } from '../api/listings.api'
import { ListingForm } from './create-listing/listing-form'

const EMPTY_DEFAULTS: CreateListingForm = {
  title: '',
  description: '',
  price: '',
  locationText: '',
  latitude: '',
  longitude: '',
  maxGuests: '',
  bedrooms: '',
  bathrooms: '',
  cleaningFee: '',
  propertyType: '',
  minNights: '',
  maxNights: '',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  additionalInfo: '',
  amenityIds: [],
  customAmenities: [],
}

export function CreateListingPage() {
  const navigate = useNavigate()
  const createMutation = useCreateListing()

  const handleSubmit = (
    data: CreateListingForm,
    status: ListingStatus,
    photos: File[],
  ) => {
    createMutation.mutate(
      { formData: data, status, photos },
      {
        onSuccess: (listing) => {
          void navigate({
            to: '/host/listings/$listingId',
            params: { listingId: listing.id },
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
            Create New Listing
          </h2>
          <p className="text-body-sm text-muted-foreground">
            Add a new property to your portfolio.
          </p>
        </div>
      </div>

      <ListingForm
        mode="create"
        defaultValues={EMPTY_DEFAULTS}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending}
        error={createMutation.error}
      />
    </div>
  )
}
