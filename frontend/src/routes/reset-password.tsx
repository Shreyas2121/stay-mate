import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthLayout, ResetPasswordForm, useAuthStore } from '@/features/auth'

interface ResetPasswordSearch {
  token?: string
}

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    token: search.token ? String(search.token) : undefined,
  }),
  beforeLoad: () => {
    if (useAuthStore.getState().accessToken) {
      throw redirect({ to: '/' })
    }
  },
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const search = Route.useSearch()

  return (
    <AuthLayout>
      <ResetPasswordForm token={search.token} />
    </AuthLayout>
  )
}
