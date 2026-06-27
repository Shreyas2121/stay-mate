import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { DollarSign, Clock, Moon } from 'lucide-react'
import type { CreateListingForm } from '../../types/listing.types'
import { Input } from '@/components/ui/input'

interface Props {
  register: UseFormRegister<CreateListingForm>
  errors: FieldErrors<CreateListingForm>
}

export function PricingRulesSection({ register, errors }: Props) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2.5 text-foreground">
        <DollarSign className="size-5 text-primary" />
        <h3 className="text-lg font-bold">Pricing & Rules</h3>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="price"
            className="text-sm font-semibold text-foreground"
          >
            Price per Night (USD) <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="price"
              type="number"
              step="0.01"
              min={0}
              placeholder="100.00"
              className="w-full pl-8 pr-3.5"
              {...register('price', {
                required: 'Required',
                valueAsNumber: true,
                min: { value: 0, message: 'Must be positive' },
              })}
            />
          </div>
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="cleaningFee"
            className="text-sm font-semibold text-foreground"
          >
            Cleaning Fee (USD) <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="cleaningFee"
              type="number"
              step="0.01"
              min={0}
              placeholder="20.00"
              className="w-full pl-8 pr-3.5"
              {...register('cleaningFee', {
                required: 'Required',
                valueAsNumber: true,
                min: { value: 0, message: 'Must be positive' },
              })}
            />
          </div>
          {errors.cleaningFee && (
            <p className="text-xs text-destructive">
              {errors.cleaningFee.message}
            </p>
          )}
        </div>
      </div>

      {/* Stay Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="minNights"
            className="text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <Moon className="size-4 text-muted-foreground" />
            Minimum Nights <span className="text-destructive">*</span>
          </label>
          <Input
            id="minNights"
            type="number"
            min={1}
            placeholder="1"
            className="w-full"
            {...register('minNights', {
              required: 'Required',
              valueAsNumber: true,
              min: { value: 1, message: 'At least 1' },
            })}
          />
          {errors.minNights && (
            <p className="text-xs text-destructive">
              {errors.minNights.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="maxNights"
            className="text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <Moon className="size-4 text-muted-foreground" />
            Maximum Nights <span className="text-destructive">*</span>
          </label>
          <Input
            id="maxNights"
            type="number"
            min={1}
            placeholder="30"
            className="w-full"
            {...register('maxNights', {
              required: 'Required',
              valueAsNumber: true,
              min: { value: 1, message: 'At least 1' },
            })}
          />
          {errors.maxNights && (
            <p className="text-xs text-destructive">
              {errors.maxNights.message}
            </p>
          )}
        </div>
      </div>

      {/* Check-in / Check-out Times */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="checkInTime"
            className="text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <Clock className="size-4 text-muted-foreground" />
            Check-in Time <span className="text-destructive">*</span>
          </label>
          <Input
            id="checkInTime"
            type="time"
            className="w-full"
            {...register('checkInTime', { required: 'Required' })}
          />
          {errors.checkInTime && (
            <p className="text-xs text-destructive">
              {errors.checkInTime.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="checkOutTime"
            className="text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <Clock className="size-4 text-muted-foreground" />
            Check-out Time <span className="text-destructive">*</span>
          </label>
          <Input
            id="checkOutTime"
            type="time"
            className="w-full"
            {...register('checkOutTime', { required: 'Required' })}
          />
          {errors.checkOutTime && (
            <p className="text-xs text-destructive">
              {errors.checkOutTime.message}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
