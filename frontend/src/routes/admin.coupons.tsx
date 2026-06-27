import { createFileRoute } from '@tanstack/react-router'
import { CouponManagementPage } from '@/features/admin'

export const Route = createFileRoute('/admin/coupons')({
  component: CouponManagementPage,
})
