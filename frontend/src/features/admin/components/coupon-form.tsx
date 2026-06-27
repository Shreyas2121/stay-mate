import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CouponFormValues } from '../types/admin.types'

interface CouponFormProps {
  values: CouponFormValues
  onChange: (values: CouponFormValues) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
  submitLabel: string
  isPending: boolean
}

export function CouponForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  isPending,
}: CouponFormProps) {
  const setField = <K extends keyof CouponFormValues>(
    field: K,
    value: CouponFormValues[K],
  ) => {
    onChange({
      ...values,
      [field]: value,
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Coupon code</span>
          <Input
            value={values.code}
            onChange={(event) => setField('code', event.target.value.toUpperCase())}
            placeholder="WELCOME10"
            required
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Discount type</span>
          <Select
            value={values.discountType}
            onValueChange={(value) =>
              setField('discountType', value as CouponFormValues['discountType'])
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select discount type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percent</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Discount value</span>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={values.discount}
            onChange={(event) => setField('discount', event.target.value)}
            placeholder={values.discountType === 'percent' ? '10' : '25'}
            required
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Expiry date</span>
          <Input
            type="datetime-local"
            value={values.expiryDate}
            onChange={(event) => setField('expiryDate', event.target.value)}
          />
        </label>
      </div>

      <label className="space-y-2 text-sm block">
        <span className="font-medium text-foreground">Target user ID</span>
        <Input
          value={values.userId}
          onChange={(event) => setField('userId', event.target.value)}
          placeholder="Optional UUID for user-targeted coupon"
        />
      </label>

      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={values.isPublic}
            onCheckedChange={(checked) => setField('isPublic', checked === true)}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground">
              Show as public coupon
            </span>
            <p className="text-xs text-muted-foreground">
              Public coupons can be displayed on checkout. Leave this off for
              code-only or user-targeted campaigns.
            </p>
          </div>
        </label>
      </div>

      {values.discountType === 'percent' && Number(values.discount || '0') > 100 ? (
        <Textarea
          readOnly
          value="Percent discounts above 100 will be rejected by the backend."
          className="min-h-0 resize-none border-destructive/30 bg-destructive/5 text-destructive"
        />
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}
