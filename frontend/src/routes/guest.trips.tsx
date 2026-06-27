import { createFileRoute } from '@tanstack/react-router'
import { BookingsListPage, useMyBookings } from '@/features/bookings'

export const Route = createFileRoute('/guest/trips')({
  component: GuestTripsRoute,
})

function GuestTripsRoute() {
  const { data: bookings, isLoading, isError } = useMyBookings()

  return (
    <BookingsListPage
      title="My Trips"
      description="Track your upcoming stays, completed trips, and payment snapshots."
      emptyTitle="No trips yet"
      emptyDescription="Once you book a stay, it will appear here with the dates, host, status, and full price breakdown."
      mode="guest"
      bookings={bookings}
      isLoading={isLoading}
      isError={isError}
    />
  )
}
