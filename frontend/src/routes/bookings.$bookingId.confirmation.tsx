import { createFileRoute } from '@tanstack/react-router'
import { BookingConfirmationPage } from '@/features/checkout/components/booking-confirmation-page'

export const Route = createFileRoute('/bookings/$bookingId/confirmation')({
  component: RouteComponent,
})

function RouteComponent() {
  const { bookingId } = Route.useParams()
  return <BookingConfirmationPage bookingId={bookingId} />
}
