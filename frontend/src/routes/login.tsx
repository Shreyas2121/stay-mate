import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore, AuthLayout, LoginForm } from '@/features/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
