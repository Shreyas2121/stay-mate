import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { CalendarDays, Heart, MessageSquareText } from 'lucide-react'
import { AccessDenied } from '@/components/access-denied'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { useCurrentUser } from '@/features/auth'

export const Route = createFileRoute('/guest')({
  component: GuestLayout,
})

const GUEST_SIDEBAR_ITEMS = [
  {
    label: 'My Trips',
    to: '/guest/trips',
    icon: <CalendarDays className="size-5" />,
  },
  {
    label: 'Saved',
    to: '/guest/saved',
    icon: <Heart className="size-5" />,
  },
  {
    label: 'Messages',
    to: '/guest/messages',
    icon: <MessageSquareText className="size-5" />,
  },
]

function GuestLayout() {
  const { user, isAuthenticated } = useCurrentUser()
  const navigate = useNavigate()

  if (!isAuthenticated || !user) {
    return (
      <AccessDenied
        title="Sign in required"
        description="You must be signed in to view your trips."
        actionLabel="Go to Login"
        onAction={() => void navigate({ to: '/login' })}
      />
    )
  }

  if (user.activeRole !== 'guest' || user.role === 'admin') {
    return (
      <AccessDenied
        title="Guest mode required"
        description="Switch to Guest mode to view your trips."
        actionLabel="Back to Home"
        onAction={() => void navigate({ to: '/' })}
      />
    )
  }

  return (
    <DashboardLayout title="Guest Dashboard" sidebarItems={GUEST_SIDEBAR_ITEMS}>
      <Outlet />
    </DashboardLayout>
  )
}
