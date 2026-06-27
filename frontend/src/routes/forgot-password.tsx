import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthLayout, ForgotPasswordForm, useAuthStore } from '@/features/auth'

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: () => {
    if (useAuthStore.getState().accessToken) {
      throw redirect({ to: '/' })
    }
  },
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
