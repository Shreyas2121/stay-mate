import { createFileRoute } from '@tanstack/react-router'
import { CheckoutPage, type CheckoutSearch } from '@/features/checkout'


export const Route = createFileRoute('/checkout/$listingId')({
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => {
    return {
      checkIn: search.checkIn as string,
      checkOut: search.checkOut as string,
      guests: Number(search.guests) || 1,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { listingId } = Route.useParams()
  const search = Route.useSearch()

  return <CheckoutPage listingId={listingId} search={search} />
}
