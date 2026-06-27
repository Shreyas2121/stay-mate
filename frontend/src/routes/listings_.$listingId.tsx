import { createFileRoute } from '@tanstack/react-router'
import { ListingDetailsPage } from '@/features/listings'

export const Route = createFileRoute('/listings_/$listingId')({
  component: ListingDetailsPage,
})
