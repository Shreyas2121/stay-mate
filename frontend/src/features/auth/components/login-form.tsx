import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { AlertCircle, Loader2 } from 'lucide-react'

import { loginSchema } from '../schemas/auth.schema'
import type { LoginFormData } from '../schemas/auth.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { useAuth } from '../hooks/use-auth'

export function LoginForm() {
  const { loginMutation } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function onSubmit(data: LoginFormData) {
    loginMutation.mutate(data)
  }

  // Derive error message directly from the mutation state
  const mutationError = loginMutation.error as any
  const apiError = mutationError
    ? mutationError.response?.data?.error?.message ||
      mutationError.response?.data?.message ||
      'Invalid email or password. Please try again.'
    : null

  return (
    <>
      {/* Header */}
      <header className="mb-6">
        <h2 className="mb-1 text-[28px] font-semibold leading-tight tracking-tight text-slate-900">
          Welcome Back
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-500">
          Log in to manage your bookings and explore new destinations.
        </p>
      </header>

      {/* Global API Error Banner */}
      {apiError && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-5">
          {/* Email */}
          <Field data-invalid={!!errors.email || undefined}>
            <FieldLabel
              htmlFor="email-login"
              className="text-sm font-semibold text-slate-800"
            >
              Email Address
            </FieldLabel>
            <Input
              id="email-login"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={loginMutation.isPending}
              aria-invalid={!!errors.email}
              className="h-12 rounded-lg border-border-muted bg-surface-subtle px-4 text-sm"
              {...register('email')}
            />
            <FieldError errors={errors.email ? [errors.email] : undefined} />
          </Field>

          {/* Password */}
          <Field data-invalid={!!errors.password || undefined}>
            <div className="flex items-center justify-between">
              <FieldLabel
                htmlFor="password-login"
                className="text-sm font-semibold text-slate-800"
              >
                Password
              </FieldLabel>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <Input
              id="password-login"
              type="password"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              autoComplete="current-password"
              disabled={loginMutation.isPending}
              aria-invalid={!!errors.password}
              className="h-12 rounded-lg border-border-muted bg-surface-subtle px-4 text-sm"
              {...register('password')}
            />
            <FieldError
              errors={errors.password ? [errors.password] : undefined}
            />
          </Field>
        </FieldGroup>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="mt-7 h-[52px] w-full rounded-lg text-sm font-semibold uppercase tracking-widest flex items-center justify-center gap-2"
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Logging inâ€¦
            </>
          ) : (
            'Login'
          )}
        </Button>
      </form>

      {/* Separator + Register link */}
      <div className="mt-8 border-t border-border-muted pt-6 text-center">
        <p className="text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </>
  )
}

