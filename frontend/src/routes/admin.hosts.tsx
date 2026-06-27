import { createFileRoute } from '@tanstack/react-router'
import { HostManagementPage } from '@/features/admin'

export const Route = createFileRoute('/admin/hosts')({
  component: HostManagementPage,
})
