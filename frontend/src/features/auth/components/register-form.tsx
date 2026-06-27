import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { AlertCircle, Loader2 } from 'lucide-react'

import { registerSchema } from '../schemas/auth.schema'
import type { RegisterFormData } from '../schemas/auth.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { useAuth } from '../hooks/use-auth'

export function RegisterForm() {
  const { registerMutation } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  })

  function onSubmit(data: RegisterFormData) {
    registerMutation.mutate(data)
  }

  // Derive error message directly from the mutation state
  const mutationError = registerMutation.error as any
  const apiError = mutationError
    ? mutationError.response?.data?.error?.message ||
      mutationError.response?.data?.message ||
      'Failed to register. Please check your credentials.'
    : null

  const isPending = registerMutation.isPending

  return (
    <>
      <header className="mb-5">
        <h2 className="mb-1 text-[28px] font-semibold leading-tight tracking-tight text-slate-900">
          Join StayMate
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-500">
          Create an account to start your journey with premium hospitality.
        </p>
      </header>

      {/* Global API Error Banner */}
      {apiError && (
        <div className="mb-5 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-4">
          {/* Full Name */}
          <Field data-invalid={!!errors.fullName || undefined}>
            <FieldLabel
              htmlFor="name-signup"
              className="text-sm font-semibold text-slate-800"
            >
              Full Name
            </FieldLabel>
            <Input
              id="name-signup"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              disabled={isPending}
              aria-invalid={!!errors.fullName}
              className="h-11 rounded-lg border-border-muted bg-surface-subtle px-4 text-sm"
              {...register('fullName')}
            />
            <FieldError
              errors={errors.fullName ? [errors.fullName] : undefined}
            />
          </Field>

          {/* Email */}
          <Field data-invalid={!!errors.email || undefined}>
            <FieldLabel
              htmlFor="email-signup"
              className="text-sm font-semibold text-slate-800"
            >
              Email Address
            </FieldLabel>
            <Input
              id="email-signup"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isPending}
              aria-invalid={!!errors.email}
              className="h-11 rounded-lg border-border-muted bg-surface-subtle px-4 text-sm"
              {...register('email')}
            />
            <FieldError errors={errors.email ? [errors.email] : undefined} />
          </Field>

          {/* Password */}
          <Field data-invalid={!!errors.password || undefined}>
            <FieldLabel
              htmlFor="password-signup"
              className="text-sm font-semibold text-slate-800"
            >
              Create Password
            </FieldLabel>
            <Input
              id="password-signup"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              disabled={isPending}
              aria-invalid={!!errors.password}
              className="h-11 rounded-lg border-border-muted bg-surface-subtle px-4 text-sm"
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
          disabled={isPending}
          className="mt-6 h-[50px] w-full rounded-lg text-sm font-semibold uppercase tracking-widest flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Creating account…
            </>
          ) : (
            'Sign Up'
          )}
        </Button>
      </form>

      {/* Separator + Login Link */}
      <div className="mt-6 border-t border-border-muted pt-5 text-center">
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline"
          >
            Log in instead
          </Link>
        </p>
      </div>
    </>
  )
}
