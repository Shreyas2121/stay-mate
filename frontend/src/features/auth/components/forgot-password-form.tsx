import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AlertCircle, CheckCircle2, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { forgotPasswordFn } from '../api/auth.api'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../schemas/auth.schema'

export function ForgotPasswordForm() {
  const [copied, setCopied] = useState(false)
  const mutation = useMutation({ mutationFn: forgotPasswordFn })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const apiError = mutation.error as any
  const errorMessage = apiError
    ? apiError.response?.data?.error?.message ||
      apiError.response?.data?.message ||
      'Unable to prepare reset link.'
    : null

  const resetUrl = mutation.data?.resetUrl

  function onSubmit(data: ForgotPasswordFormData) {
    setCopied(false)
    mutation.mutate(data)
  }

  async function copyResetUrl() {
    if (!resetUrl) return
    await navigator.clipboard.writeText(resetUrl)
    setCopied(true)
  }

  return (
    <>
      <header className="mb-6">
        <h2 className="mb-1 text-[28px] font-semibold leading-tight tracking-tight text-slate-900">
          Reset Password
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-500">
          Enter your account email and we&apos;ll prepare a reset link.
        </p>
      </header>

      {errorMessage && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {mutation.data && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>{mutation.data.message}</span>
          </div>
          {resetUrl && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-white p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Development reset link
              </p>
              <div className="break-all text-xs text-slate-700">{resetUrl}</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyResetUrl}
                className="mt-3 gap-2"
              >
                <Copy className="size-3.5" />
                {copied ? 'Copied' : 'Copy link'}
              </Button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-5">
          <Field data-invalid={!!errors.email || undefined}>
            <FieldLabel htmlFor="forgot-email" className="text-sm font-semibold text-slate-800">
              Email Address
            </FieldLabel>
            <Input
              id="forgot-email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={mutation.isPending}
              aria-invalid={!!errors.email}
              className="h-12 rounded-lg border-border-muted bg-surface-subtle px-4 text-sm"
              {...register('email')}
            />
            <FieldError errors={errors.email ? [errors.email] : undefined} />
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="mt-7 flex h-[52px] w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold uppercase tracking-widest"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Preparing link...
            </>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>

      <div className="mt-8 border-t border-border-muted pt-6 text-center">
        <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </>
  )
}
