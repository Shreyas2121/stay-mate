import { createFileRoute } from '@tanstack/react-router'
import { HostApprovalsPage } from '@/features/admin'

export const Route = createFileRoute('/admin/host-approvals')({
  component: HostApprovalsPage,
})
