import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore, AuthLayout, RegisterForm } from '@/features/auth'

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: '/' })
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  )
}
