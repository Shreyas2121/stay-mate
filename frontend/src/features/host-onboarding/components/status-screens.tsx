import { CheckCircle2, ShieldCheck, Home as HomeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Success Screen (shown after submission) ──────────────────

export function SuccessScreen({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-[#10b981]/10 text-[#10b981] mb-6">
          <CheckCircle2 className="size-10" />
        </div>
        <h1 className="text-headline-lg text-foreground">
          Application Submitted!
        </h1>
        <p className="mt-4 text-body-md text-muted-foreground">
          Your host application has been submitted for review. Our admin team
          typically processes applications within 24 hours.
        </p>

        <div className="mt-8 rounded-2xl border border-border-muted bg-card p-6 text-left">
          <h3 className="text-body-md font-semibold text-foreground mb-3">
            What happens next?
          </h3>
          <ul className="space-y-3">
            {[
              'Admin reviews your identity and bank details',
              "You'll receive an email notification with the decision",
              'Once approved, switch to host mode from your profile',
              'Start creating listings and welcoming guests!',
            ].map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-3 text-body-sm text-muted-foreground"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={onGoHome} className="mt-8 gap-1.5">
          <HomeIcon className="size-4" />
          Back to Home
        </Button>
      </div>
    </div>
  )
}

// ─── Pending Screen (application under review) ───────────────

export function PendingScreen({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-primary/10 text-primary mb-6 animate-pulse">
          <ShieldCheck className="size-10" />
        </div>
        <h1 className="text-headline-lg text-foreground">
          Application Under Review
        </h1>
        <p className="mt-4 text-body-md text-muted-foreground">
          Your host application is currently being reviewed by our team. We
          typically process all applications within 24 hours.
        </p>

        <div className="mt-8 rounded-2xl border border-border-muted bg-card p-6 text-left">
          <h3 className="text-body-md font-semibold text-foreground mb-3">
            What happens next?
          </h3>
          <ul className="space-y-3">
            {[
              'Our team verifies your submitted details',
              'You will receive an email once the review is complete',
              'If approved, you can immediately toggle Host Mode',
              'If rejected, you will see the reason and can update and resubmit',
            ].map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-3 text-body-sm text-muted-foreground"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold animate-bounce">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={onGoHome} className="mt-8 gap-1.5">
          <HomeIcon className="size-4" />
          Back to Home
        </Button>
      </div>
    </div>
  )
}

// ─── Verified Screen (application approved) ──────────────────

export function VerifiedScreen({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-[#10b981]/10 text-[#10b981] mb-6">
          <CheckCircle2 className="size-10" />
        </div>
        <h1 className="text-headline-lg text-foreground">
          Application Approved!
        </h1>
        <p className="mt-4 text-body-md text-muted-foreground">
          Congratulations! Your host application has been approved. You are now
          a verified host on StayMate.
        </p>

        <div className="mt-8 rounded-2xl border border-border-muted bg-card p-6 text-left">
          <h3 className="text-body-md font-semibold text-foreground mb-3">
            What can you do now?
          </h3>
          <ul className="space-y-3">
            {[
              'Switch to Host Mode from your profile menu',
              'Access your new Host Dashboard',
              'Create listings and set your pricing/availability',
              'Manage reservations and chat with guests',
            ].map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-3 text-body-sm text-muted-foreground"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#10b981]/10 text-[#10b981] text-xs font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={onGoHome} className="mt-8 gap-1.5">
          <HomeIcon className="size-4" />
          Go to Home
        </Button>
      </div>
    </div>
  )
}
