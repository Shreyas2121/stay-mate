import { createFileRoute } from '@tanstack/react-router'
import { AdminListingBookingsPage } from '@/features/admin'

export const Route = createFileRoute('/admin/listings/$listingId/bookings')({
  component: AdminListingBookingsRoute,
})

function AdminListingBookingsRoute() {
  const { listingId } = Route.useParams()
  return <AdminListingBookingsPage listingId={listingId} />
}
