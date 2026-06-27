import { createFileRoute } from '@tanstack/react-router'
import { HostReviewsPage } from '@/features/host-dashboard/components/host-reviews-page'

export const Route = createFileRoute('/host/reviews')({
  component: HostReviewsRoute,
})

function HostReviewsRoute() {
  return <HostReviewsPage />
}
