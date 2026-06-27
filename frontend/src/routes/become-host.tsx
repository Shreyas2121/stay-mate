import { createFileRoute } from '@tanstack/react-router'
import { BecomeHostPage } from '@/features/host-onboarding'

export const Route = createFileRoute('/become-host')({
  component: BecomeHostPage,
})
