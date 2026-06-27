import { createFileRoute } from '@tanstack/react-router'
import { AdminFinancePage } from '@/features/admin'

export const Route = createFileRoute('/admin/finance')({
  component: AdminFinancePage,
})
