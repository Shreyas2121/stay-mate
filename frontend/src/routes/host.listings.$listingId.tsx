import { createFileRoute } from '@tanstack/react-router'
import { ListingDetailPage } from '@/features/host-dashboard'

export const Route = createFileRoute('/host/listings/$listingId')({
  component: () => {
    const { listingId } = Route.useParams()
    return <ListingDetailPage listingId={listingId} />
  },
})
