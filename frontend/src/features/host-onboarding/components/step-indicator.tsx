import { CheckCircle2 } from 'lucide-react'
import { STEPS } from '../constants/host-onboarding.constants'

interface StepIndicatorProps {
  currentStep: number
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-0">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep
        const isCompleted = step.id < currentStep

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex size-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-muted bg-card text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="size-4" /> : step.icon}
              </div>
              <span
                className={`hidden sm:block text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-foreground'
                    : isCompleted
                      ? 'text-primary'
                      : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {index < STEPS.length - 1 && (
              <div
                className={`mx-3 sm:mx-4 h-px w-8 sm:w-12 transition-colors ${
                  isCompleted ? 'bg-primary' : 'bg-border-muted'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
