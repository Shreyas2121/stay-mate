import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Percent, Ticket, User2 } from 'lucide-react'
import type { Coupon } from '../types/admin.types'

interface CouponCardProps {
  coupon: Coupon
  onEdit: (coupon: Coupon) => void
  onDeactivate: (couponId: string) => void
  isPending: boolean
}

export function CouponCard({
  coupon,
  onEdit,
  onDeactivate,
  isPending,
}: CouponCardProps) {
  const expiryLabel = coupon.expiryDate
    ? new Date(coupon.expiryDate).toLocaleString()
    : 'No expiry'

  return (
    <Card className="rounded-2xl border border-border bg-card/90 shadow-2xs">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Ticket className="size-4 text-primary" />
              {coupon.code}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant={coupon.isActive ? 'secondary' : 'destructive'}>
                {coupon.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">
                {coupon.isPublic ? 'Public' : 'Code only'}
              </Badge>
              <Badge variant="outline">
                {coupon.discountType === 'percent'
                  ? `${coupon.discount}% off`
                  : `$${coupon.discount.toFixed(2)} off`}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-sm">
        <div className="flex items-start gap-2.5">
          <Percent className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
          <div>
            <div className="font-medium text-foreground">Discount</div>
            <div className="text-muted-foreground">
              {coupon.discountType === 'percent'
                ? `${coupon.discount}% on base amount`
                : `$${coupon.discount.toFixed(2)} flat discount`}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <CalendarDays className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
          <div>
            <div className="font-medium text-foreground">Expiry</div>
            <div className="text-muted-foreground">{expiryLabel}</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 sm:col-span-2">
          <User2 className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
          <div>
            <div className="font-medium text-foreground">Targeting</div>
            <div className="text-muted-foreground break-all">
              {coupon.userId ? `User-specific: ${coupon.userId}` : 'Available to all eligible users'}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-3 border-t border-border/60 pt-4">
        <Button variant="outline" onClick={() => onEdit(coupon)} disabled={isPending}>
          Edit
        </Button>
        {coupon.isActive ? (
          <Button
            variant="destructive"
            onClick={() => onDeactivate(coupon.id)}
            disabled={isPending}
          >
            Deactivate
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
