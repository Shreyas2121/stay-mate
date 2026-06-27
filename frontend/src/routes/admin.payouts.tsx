import { createFileRoute } from '@tanstack/react-router'
import { AdminPayoutsPage } from '@/features/admin'

export const Route = createFileRoute('/admin/payouts')({
  component: AdminPayoutsPage,
})
