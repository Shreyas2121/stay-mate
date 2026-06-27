import { createFileRoute } from '@tanstack/react-router'
import { HostEarningsPage } from '@/features/host-dashboard'

export const Route = createFileRoute('/host/earnings')({
  component: HostEarningsPage,
})
