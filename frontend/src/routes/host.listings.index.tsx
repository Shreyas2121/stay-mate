import { createFileRoute } from '@tanstack/react-router'
import { HostListingsPage } from '@/features/host-dashboard'

export const Route = createFileRoute('/host/listings/')({
  component: HostListingsPage,
})
