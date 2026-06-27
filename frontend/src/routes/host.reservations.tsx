import { createFileRoute } from '@tanstack/react-router'
import { BookingsListPage, useHostBookings } from '@/features/bookings'

export const Route = createFileRoute('/host/reservations')({
  component: HostReservationsRoute,
})

function HostReservationsRoute() {
  const { data: bookings, isLoading, isError } = useHostBookings()

  return (
    <BookingsListPage
      title="Reservations"
      description="View reservations across all of your listings with guest and payment context."
      emptyTitle="No reservations yet"
      emptyDescription="Reservations for your listings will appear here after guests complete checkout or seeded bookings are added."
      mode="host"
      bookings={bookings}
      isLoading={isLoading}
      isError={isError}
    />
  )
}
