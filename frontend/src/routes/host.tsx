import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCurrentUser } from '@/features/auth'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Banknote, CalendarDays, Home as HomeIcon, MessageSquareText } from 'lucide-react'
import { AccessDenied } from '@/components/access-denied'

export const Route = createFileRoute('/host')({
  component: HostLayout,
})

const HOST_SIDEBAR_ITEMS = [
  {
    label: 'My Listings',
    to: '/host/listings',
    icon: <HomeIcon className="size-5" />,
  },
  {
    label: 'Reservations',
    to: '/host/reservations',
    icon: <CalendarDays className="size-5" />,
  },
  {
    label: 'Messages',
    to: '/host/messages',
    icon: <MessageSquareText className="size-5" />,
  },
  {
    label: 'Reviews',
    to: '/host/reviews',
    icon: <MessageSquareText className="size-5" />,
  },
  {
    label: 'Earnings',
    to: '/host/earnings',
    icon: <Banknote className="size-5" />,
  },
]

function HostLayout() {
  const { user, isAuthenticated } = useCurrentUser()
  const navigate = useNavigate()

  if (!isAuthenticated || !user) {
    return (
      <AccessDenied
        title="Sign in required"
        description="You must be signed in as a host to access this dashboard."
        actionLabel="Go to Login"
        onAction={() => void navigate({ to: '/login' })}
      />
    )
  }

  if (user.activeRole !== 'host') {
    return (
      <AccessDenied
        title="Host mode required"
        description="Switch to Host mode to access the host dashboard."
        actionLabel="Back to Home"
        onAction={() => void navigate({ to: '/' })}
      />
    )
  }

  return (
    <DashboardLayout title="Host Dashboard" sidebarItems={HOST_SIDEBAR_ITEMS}>
      <Outlet />
    </DashboardLayout>
  )
}


