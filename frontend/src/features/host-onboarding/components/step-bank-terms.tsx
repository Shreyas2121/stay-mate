import { CreditCard, Landmark, CheckCircle2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldDescription,
} from '@/components/ui/field'
import type { StepProps } from '../types/host-onboarding.types'

export function StepBankAndTerms({ register, errors, watch, setValue }: StepProps) {
  const agreeToTerms = watch?.('agreeToTerms') ?? false

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CreditCard className="size-5" />
        </div>
        <div>
          <h2 className="text-headline-sm text-foreground">
            Payout Details & Terms
          </h2>
          <p className="text-body-sm text-muted-foreground">
            Set up your payout account and agree to host terms.
          </p>
        </div>
      </div>

      <FieldGroup>
        <Field>
          <Label htmlFor="host-bank-info">
            <Landmark className="size-4 text-muted-foreground" />
            Bank Account Details
          </Label>
          <Textarea
            id="host-bank-info"
            rows={3}
            placeholder="Bank name, Account holder name, Account number, Routing / IFSC code"
            className="resize-none"
            aria-invalid={!!errors.bankInfo}
            {...register('bankInfo', {
              required: 'Bank details are required for payouts',
              minLength: {
                value: 10,
                message: 'Please provide complete bank details',
              },
            })}
          />
          <FieldDescription>
            Weekly payouts will be sent to this account. You can update this
            later in your host dashboard.
          </FieldDescription>
          {errors.bankInfo && (
            <FieldError>{errors.bankInfo.message}</FieldError>
          )}
        </Field>

        {/* Payout info card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 rounded-xl bg-muted/50 border border-border-muted p-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Platform Fee
            </span>
            <span className="text-headline-md text-foreground">2%</span>
            <span className="text-xs text-muted-foreground">
              Deducted from each booking
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-muted/50 border border-border-muted p-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payout Schedule
            </span>
            <span className="text-headline-md text-foreground">Weekly</span>
            <span className="text-xs text-muted-foreground">
              Every Monday at 9:00 AM
            </span>
          </div>
        </div>

        {/* Terms agreement */}
        <div className="mt-2">
          <label
            htmlFor="host-agree-terms"
            className="flex items-start gap-3 cursor-pointer group"
          >
            <Checkbox
              id="host-agree-terms"
              className="mt-1"
              checked={agreeToTerms}
              onCheckedChange={(checked) => {
                if (setValue) {
                  setValue('agreeToTerms', !!checked, { shouldValidate: true })
                }
              }}
              aria-invalid={!!errors.agreeToTerms}
            />
            {/* Hidden input to register it natively in hook-form */}
            <input
              type="hidden"
              {...register('agreeToTerms', {
                required: 'You must agree to the host terms to proceed',
              })}
            />
            <div className="text-body-sm">
              <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                I agree to the StayMate Host Terms of Service
              </span>
              <p className="mt-1 text-muted-foreground">
                By checking this box, you acknowledge that you've read and agree
                to our{' '}
                <span className="text-primary underline underline-offset-2 cursor-pointer">
                  Host Terms
                </span>
                ,{' '}
                <span className="text-primary underline underline-offset-2 cursor-pointer">
                  Privacy Policy
                </span>
                , and{' '}
                <span className="text-primary underline underline-offset-2 cursor-pointer">
                  Community Guidelines
                </span>
                . All submitted information will be reviewed by our verification
                team.
              </p>
            </div>
          </label>
          {errors.agreeToTerms && (
            <FieldError className="mt-2">
              {errors.agreeToTerms.message}
            </FieldError>
          )}
        </div>

        {/* Summary */}
        {agreeToTerms && (
          <div className="flex items-start gap-3 rounded-xl bg-[#10b981]/5 border border-[#10b981]/20 p-4 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
            <div className="text-body-sm text-muted-foreground">
              <p className="font-medium text-foreground">Ready to submit</p>
              <p className="mt-1">
                Click "Submit Application" to send your host profile for admin
                review. You'll receive an email once your application is
                processed.
              </p>
            </div>
          </div>
        )}
      </FieldGroup>
    </div>
  )
}
