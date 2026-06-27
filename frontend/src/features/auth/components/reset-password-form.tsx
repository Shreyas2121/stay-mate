import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { resetPasswordFn } from '../api/auth.api'
import { resetPasswordSchema, type ResetPasswordFormData } from '../schemas/auth.schema'

export function ResetPasswordForm({ token }: { token?: string }) {
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: resetPasswordFn,
    onSuccess: () => {
      setTimeout(() => void navigate({ to: '/login' }), 900)
    },
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '' },
  })

  const apiError = mutation.error as any
  const errorMessage = apiError
    ? apiError.response?.data?.error?.message ||
      apiError.response?.data?.message ||
      'Unable to reset password.'
    : null

  function onSubmit(data: ResetPasswordFormData) {
    if (!token) return
    mutation.mutate({ ...data, token })
  }

  return (
    <>
      <header className="mb-6">
        <h2 className="mb-1 text-[28px] font-semibold leading-tight tracking-tight text-slate-900">
          Choose New Password
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-500">
          Use a new password to restore access to your StayMate account.
        </p>
      </header>

      {!token && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>Reset token is missing. Request a new reset link.</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {mutation.isSuccess && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>Password reset successfully. Redirecting to login...</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-5">
          <Field data-invalid={!!errors.password || undefined}>
            <FieldLabel htmlFor="reset-password" className="text-sm font-semibold text-slate-800">
              New Password
            </FieldLabel>
            <Input
              id="reset-password"
              type="password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              disabled={mutation.isPending || !token}
              aria-invalid={!!errors.password}
              className="h-12 rounded-lg border-border-muted bg-surface-subtle px-4 text-sm"
              {...register('password')}
            />
            <FieldError errors={errors.password ? [errors.password] : undefined} />
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          disabled={mutation.isPending || !token}
          className="mt-7 flex h-[52px] w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold uppercase tracking-widest"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>

      <div className="mt-8 border-t border-border-muted pt-6 text-center">
        <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
          Request a new link
        </Link>
      </div>
    </>
  )
}
