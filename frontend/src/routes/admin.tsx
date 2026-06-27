import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCurrentUser } from '@/features/auth'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Banknote, ChartNoAxesCombined, TicketPercent, UserCheck, Users } from 'lucide-react'
import { AccessDenied } from '@/components/access-denied'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

const ADMIN_SIDEBAR_ITEMS = [
  {
    label: 'Hosts',
    to: '/admin/hosts',
    icon: <Users className="size-5" />,
  },
  {
    label: 'Host Approvals',
    to: '/admin/host-approvals',
    icon: <UserCheck className="size-5" />,
  },
  {
    label: 'Finance',
    to: '/admin/finance',
    icon: <ChartNoAxesCombined className="size-5" />,
  },
  {
    label: 'Payouts',
    to: '/admin/payouts',
    icon: <Banknote className="size-5" />,
  },
  {
    label: 'Coupons',
    to: '/admin/coupons',
    icon: <TicketPercent className="size-5" />,
  },
]

function AdminLayout() {
  const { user, isAuthenticated } = useCurrentUser()
  const navigate = useNavigate()

  if (!isAuthenticated || !user) {
    return (
      <AccessDenied
        title="Sign in required"
        description="You must be signed in as an administrator to view this portal."
        actionLabel="Go to Login"
        onAction={() => void navigate({ to: '/login' })}
      />
    )
  }

  if (user.role !== 'admin') {
    return (
      <AccessDenied
        title="Access Denied"
        description="You do not have the required administrative permissions to access this page."
        actionLabel="Back to Home"
        onAction={() => void navigate({ to: '/' })}
      />
    )
  }

  return (
    <DashboardLayout title="Admin Portal" sidebarItems={ADMIN_SIDEBAR_ITEMS}>
      <Outlet />
    </DashboardLayout>
  )
}
