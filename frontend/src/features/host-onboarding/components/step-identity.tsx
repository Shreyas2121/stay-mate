import { useEffect } from 'react'
import { IdCard, FileText, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldDescription,
} from '@/components/ui/field'
import { ID_TYPES } from '../constants/host-onboarding.constants'
import type { StepProps } from '../types/host-onboarding.types'

export function StepIdentityVerification({
  register,
  errors,
  watch,
  setValue,
}: StepProps) {
  const selectedIdType = watch?.('idType') ?? ''

  useEffect(() => {
    if (register) {
      register('idType', { required: 'ID type is required' })
    }
  }, [register])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <IdCard className="size-5" />
        </div>
        <div>
          <h2 className="text-headline-sm text-foreground">
            Identity Verification
          </h2>
          <p className="text-body-sm text-muted-foreground">
            We verify your identity for guest safety. Data is encrypted and
            securely stored.
          </p>
        </div>
      </div>

      <FieldGroup>
        <Field>
          <Label htmlFor="host-id-type">
            <IdCard className="size-4 text-muted-foreground" />
            Government ID Type
          </Label>
          <Select
            onValueChange={(val) => {
              if (setValue) {
                setValue('idType', val, { shouldValidate: true })
              }
            }}
            defaultValue={selectedIdType}
          >
            <SelectTrigger
              id="host-id-type"
              className={errors.idType ? 'border-destructive ring-destructive' : ''}
              aria-invalid={!!errors.idType}
            >
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent>
              {ID_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.idType && <FieldError>{errors.idType.message}</FieldError>}
        </Field>

        <Field>
          <Label htmlFor="host-id-number">
            <FileText className="size-4 text-muted-foreground" />
            ID Number
          </Label>
          <Input
            id="host-id-number"
            placeholder={
              selectedIdType === 'passport'
                ? 'e.g. A12345678'
                : selectedIdType === 'aadhar'
                  ? 'e.g. 1234 5678 9012'
                  : 'Enter your ID number'
            }
            aria-invalid={!!errors.idNumber}
            {...register('idNumber', {
              required: 'ID number is required',
              minLength: {
                value: 4,
                message: 'ID number seems too short',
              },
            })}
          />
          <FieldDescription>
            This is stored securely and only used for verification purposes.
          </FieldDescription>
          {errors.idNumber && (
            <FieldError>{errors.idNumber.message}</FieldError>
          )}
        </Field>

        {/* Trust indicators */}
        <div className="flex items-start gap-3 rounded-xl bg-muted/50 border border-border-muted p-4 mt-2">
          <ShieldCheck className="size-5 text-success shrink-0 mt-0.5" />
          <div className="text-body-sm text-muted-foreground">
            <p className="font-medium text-foreground">Your data is safe</p>
            <p className="mt-1">
              Identity information is encrypted using AES-256 and never shared
              with guests. Only our verification team accesses this data.
            </p>
          </div>
        </div>
      </FieldGroup>
    </div>
  )
}
