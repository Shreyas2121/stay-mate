import { createFileRoute } from '@tanstack/react-router'
import { CreateListingPage } from '@/features/host-dashboard'

export const Route = createFileRoute('/host/listings_/new')({
  component: CreateListingPage,
})
