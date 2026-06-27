import { createFileRoute } from '@tanstack/react-router'
import { AdminHostDetailPage } from '@/features/admin'

export const Route = createFileRoute('/admin/hosts_/$hostId')({
  component: AdminHostDetailRoute,
})

function AdminHostDetailRoute() {
  const { hostId } = Route.useParams()
  return <AdminHostDetailPage hostId={hostId} />
}
