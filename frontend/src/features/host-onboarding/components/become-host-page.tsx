import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Home as HomeIcon,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

import { useCurrentUser } from '@/features/auth'
import { Button } from '@/components/ui/button'

import type { HostOnboardingForm } from '../types/host-onboarding.types'
import { getStepFields } from '../utils/host-onboarding.utils'
import {
  useHostProfileStatus,
  useApplyForHosting,
} from '../api/host-profile.api'

import { StepIndicator } from './step-indicator'
import { StepPersonalInfo } from './step-personal-info'
import { StepIdentityVerification } from './step-identity'
import { StepBankAndTerms } from './step-bank-terms'
import { SuccessScreen, PendingScreen, VerifiedScreen } from './status-screens'
import { AccessDenied } from '@/components/access-denied'

export function BecomeHostPage() {
  const { user, isAuthenticated } = useCurrentUser()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const { data: statusData, isLoading } = useHostProfileStatus(isAuthenticated)
  const applyMutation = useApplyForHosting()

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<HostOnboardingForm>({
    defaultValues: {
      legalName: '',
      phone: '',
      address: '',
      idType: '',
      idNumber: '',
      bankInfo: '',
      agreeToTerms: false,
    },
    mode: 'onTouched',
  })

  // Pre-fill form if application was rejected
  useEffect(() => {
    if (statusData && statusData.status === 'rejected') {
      reset({
        legalName: statusData.legalName || '',
        phone: statusData.phone || '',
        address: statusData.address || '',
        idType: statusData.idType || '',
        idNumber: statusData.idNumber || '',
        bankInfo: statusData.bankInfo || '',
        agreeToTerms: false, // User must re-agree
      })
    }
  }, [statusData, reset])

  // ─── Access guard (guest-only) ───
  if (!isAuthenticated || !user) {
    return (
      <AccessDenied
        title="Sign in required"
        description="You need to be signed in as a guest to apply for host onboarding."
        actionLabel="Go to Home"
        onAction={() => void navigate({ to: '/' })}
      />
    )
  }

  if (user.role === 'host') {
    return (
      <AccessDenied
        title="Already a host"
        description="You're already registered as a host. Head to your dashboard to manage listings."
        actionLabel="Go to Home"
        onAction={() => void navigate({ to: '/' })}
      />
    )
  }

  if (user.role === 'admin') {
    return (
      <AccessDenied
        title="Not available"
        description="Host onboarding is only available for guest accounts."
        actionLabel="Go to Home"
        onAction={() => void navigate({ to: '/' })}
      />
    )
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <div className="relative size-12">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse font-medium">
          Checking verification status...
        </p>
      </div>
    )
  }

  // Handle pending or verified status
  if (statusData?.status === 'pending') {
    return <PendingScreen onGoHome={() => void navigate({ to: '/' })} />
  }

  if (statusData?.status === 'verified') {
    return <VerifiedScreen onGoHome={() => void navigate({ to: '/' })} />
  }

  // ─── Step navigation ───
  const goToNextStep = async () => {
    const fieldsToValidate = getStepFields(currentStep)
    const isValid = await trigger(fieldsToValidate)
    if (isValid && currentStep < 3) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const onSubmit = (data: HostOnboardingForm) => {
    applyMutation.mutate(data, {
      onSuccess: () => {
        setIsSubmitted(true)
      },
    })
  }

  if (isSubmitted) {
    return <SuccessScreen onGoHome={() => void navigate({ to: '/' })} />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-xl">
        <div className="container-app">
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <HomeIcon className="size-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                StayMate
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container-app py-10 sm:py-16">
        <div className="mx-auto max-w-2xl">
          {/* Page Header */}
          <header className="text-center mb-10">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary mb-4">
              <ShieldCheck className="size-7" />
            </div>
            <h1 className="text-headline-lg text-foreground">Become a Host</h1>
            <p className="mt-2 text-body-md text-muted-foreground max-w-md mx-auto">
              Complete the verification process to start listing your properties
              on StayMate.
            </p>
          </header>

          {/* Rejection Banner */}
          {statusData?.status === 'rejected' && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-body-sm text-destructive-foreground text-left">
                <p className="font-semibold text-foreground">
                  Your previous application was rejected
                </p>
                <p className="mt-1 text-muted-foreground">
                  Reason:{' '}
                  <span className="font-medium text-foreground">
                    {statusData.rejectionReason || 'No details provided.'}
                  </span>
                </p>
                <p className="mt-2 text-xs">
                  Please review and correct your details below, then resubmit
                  your application.
                </p>
              </div>
            </div>
          )}

          {/* Submission Error Banner */}
          {applyMutation.isError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-body-sm text-destructive-foreground text-left">
                <p className="font-semibold text-foreground">
                  Failed to submit application
                </p>
                <p className="mt-1">
                  {applyMutation.error instanceof Error
                    ? (applyMutation.error as any).response?.data?.message ||
                      applyMutation.error.message
                    : 'An error occurred. Please try again.'}
                </p>
              </div>
            </div>
          )}

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} />

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-10" noValidate>
            <div className="rounded-2xl border border-border-muted bg-card p-6 sm:p-8 shadow-sm">
              {currentStep === 1 && (
                <StepPersonalInfo register={register} errors={errors} />
              )}
              {currentStep === 2 && (
                <StepIdentityVerification
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                />
              )}
              {currentStep === 3 && (
                <StepBankAndTerms
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                />
              )}

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-border-muted flex items-center justify-between gap-4">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPrevStep}
                    className="gap-1.5"
                  >
                    <ArrowLeft className="size-4" />
                    Previous
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    className="gap-1.5"
                  >
                    Next Step
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="gap-1.5"
                    disabled={applyMutation.isPending}
                  >
                    {applyMutation.isPending ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="size-4" />
                    )}
                    {applyMutation.isPending
                      ? 'Submitting...'
                      : 'Submit Application'}
                  </Button>
                )}
              </div>
            </div>
          </form>

          {/* Info callout */}
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-muted/50 border border-border-muted p-4">
            <AlertCircle className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="text-body-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                What happens after you apply?
              </p>
              <p className="mt-1">
                Our admin team reviews each application within 24 hours. You'll
                receive an email notification once your application is approved
                or if we need additional information.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
