import { User, FileText, Phone, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldDescription,
} from '@/components/ui/field'
import type { StepProps } from '../types/host-onboarding.types'

export function StepPersonalInfo({ register, errors }: StepProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <User className="size-5" />
        </div>
        <div>
          <h2 className="text-headline-sm text-foreground">
            Personal Information
          </h2>
          <p className="text-body-sm text-muted-foreground">
            Provide your legal details as they appear on your government ID.
          </p>
        </div>
      </div>

      <FieldGroup>
        <Field>
          <Label htmlFor="host-legal-name">
            <FileText className="size-4 text-muted-foreground" />
            Full Legal Name
          </Label>
          <Input
            id="host-legal-name"
            placeholder="e.g. John Michael Doe"
            aria-invalid={!!errors.legalName}
            {...register('legalName', {
              required: 'Legal name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              },
            })}
          />
          <FieldDescription>
            Must match the name on your government-issued ID.
          </FieldDescription>
          {errors.legalName && (
            <FieldError>{errors.legalName.message}</FieldError>
          )}
        </Field>

        <Field>
          <Label htmlFor="host-phone">
            <Phone className="size-4 text-muted-foreground" />
            Phone Number
          </Label>
          <Input
            id="host-phone"
            type="tel"
            placeholder="e.g. +1 (555) 123-4567"
            aria-invalid={!!errors.phone}
            {...register('phone', {
              required: 'Phone number is required',
              pattern: {
                value: /^[+]?[\d\s()-]{7,20}$/,
                message: 'Enter a valid phone number',
              },
            })}
          />
          <FieldDescription>
            We'll use this for urgent booking-related communication only.
          </FieldDescription>
          {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
        </Field>

        <Field>
          <Label htmlFor="host-address">
            <MapPin className="size-4 text-muted-foreground" />
            Residential Address
          </Label>
          <Textarea
            id="host-address"
            rows={3}
            placeholder="Street address, City, State, ZIP / Postal Code, Country"
            className="resize-none"
            aria-invalid={!!errors.address}
            {...register('address', {
              required: 'Address is required',
              minLength: {
                value: 10,
                message: 'Please provide a complete address',
              },
            })}
          />
          {errors.address && <FieldError>{errors.address.message}</FieldError>}
        </Field>
      </FieldGroup>
    </div>
  )
}
