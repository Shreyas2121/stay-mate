import { useMemo, useState } from 'react'
import { AlertTriangle, Plus, Search, TicketPercent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useAdminCoupons,
  useCreateCoupon,
  useDeactivateCoupon,
  useUpdateCoupon,
} from '../api/admin.api'
import type { Coupon, CouponFormValues } from '../types/admin.types'
import { CouponCard } from './coupon-card'
import { CouponForm } from './coupon-form'

const EMPTY_COUPON_FORM: CouponFormValues = {
  code: '',
  discountType: 'percent',
  discount: '',
  expiryDate: '',
  userId: '',
  isPublic: false,
}

function getFormValues(coupon: Coupon): CouponFormValues {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discount: coupon.discount.toString(),
    expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 16) : '',
    userId: coupon.userId ?? '',
    isPublic: coupon.isPublic,
  }
}

export function CouponManagementPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createValues, setCreateValues] = useState<CouponFormValues>(EMPTY_COUPON_FORM)
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<CouponFormValues>(EMPTY_COUPON_FORM)

  const {
    data: coupons = [],
    isLoading,
    isError,
    error,
  } = useAdminCoupons()
  const createCouponMutation = useCreateCoupon()
  const updateCouponMutation = useUpdateCoupon()
  const deactivateCouponMutation = useDeactivateCoupon()

  const activeCoupons = useMemo(
    () => coupons.filter((coupon) => coupon.isActive),
    [coupons],
  )

  const inactiveCoupons = useMemo(
    () => coupons.filter((coupon) => !coupon.isActive),
    [coupons],
  )

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    createCouponMutation.mutate(createValues, {
      onSuccess: () => {
        setCreateValues(EMPTY_COUPON_FORM)
        setIsCreateOpen(false)
      },
    })
  }

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingCouponId) return

    updateCouponMutation.mutate(
      { id: editingCouponId, values: editValues },
      {
        onSuccess: () => {
          setEditingCouponId(null)
          setEditValues(EMPTY_COUPON_FORM)
        },
      },
    )
  }

  const handleStartEdit = (coupon: Coupon) => {
    setEditingCouponId(coupon.id)
    setEditValues(getFormValues(coupon))
  }

  const handleDeactivate = (couponId: string) => {
    if (window.confirm('Deactivate this coupon? It will no longer be valid at checkout.')) {
      deactivateCouponMutation.mutate(couponId)
    }
  }

  const isAnyMutationPending =
    createCouponMutation.isPending ||
    updateCouponMutation.isPending ||
    deactivateCouponMutation.isPending

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-headline-md font-bold text-foreground">
            Coupon Management
          </h2>
          <p className="text-body-sm text-muted-foreground">
            Create checkout campaigns, targeted codes, and deactivate old offers.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen((current) => !current)}>
          <Plus className="size-4" />
          {isCreateOpen ? 'Close Form' : 'New Coupon'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Total coupons
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-foreground">{coupons.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Active coupons
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-foreground">{activeCoupons.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Public coupons
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-foreground">
              {coupons.filter((coupon) => coupon.isPublic && coupon.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {isCreateOpen ? (
        <Card className="rounded-2xl border border-primary/20 bg-card/95 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketPercent className="size-4 text-primary" />
              Create coupon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CouponForm
              values={createValues}
              onChange={setCreateValues}
              onSubmit={handleCreateSubmit}
              submitLabel="Create coupon"
              isPending={createCouponMutation.isPending}
            />
          </CardContent>
        </Card>
      ) : null}

      {editingCouponId ? (
        <Card className="rounded-2xl border border-border/80 bg-card/95 shadow-xs">
          <CardHeader>
            <CardTitle>Edit coupon</CardTitle>
          </CardHeader>
          <CardContent>
            <CouponForm
              values={editValues}
              onChange={setEditValues}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setEditingCouponId(null)
                setEditValues(EMPTY_COUPON_FORM)
              }}
              submitLabel="Save changes"
              isPending={updateCouponMutation.isPending}
            />
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="size-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Loading coupons...</span>
        </div>
      ) : isError ? (
        <div className="py-12 px-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive flex flex-col items-center justify-center text-center">
          <AlertTriangle className="size-8 mb-2" />
          <h4 className="font-bold">Failed to load coupons</h4>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            {error instanceof Error ? error.message : 'An unknown error occurred.'}
          </p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="py-20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center p-6 bg-card/30">
          <div className="size-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
            <Search className="size-6" />
          </div>
          <h3 className="font-bold text-foreground">No coupons created yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mt-1">
            Start with an admin-created public campaign or a targeted code for a specific user.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Active coupons</h3>
              <p className="text-sm text-muted-foreground">
                These coupons can still be used during checkout.
              </p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {activeCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onEdit={handleStartEdit}
                  onDeactivate={handleDeactivate}
                  isPending={isAnyMutationPending}
                />
              ))}
            </div>
          </section>

          {inactiveCoupons.length > 0 ? (
            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Inactive coupons</h3>
                <p className="text-sm text-muted-foreground">
                  Archived offers kept for reference.
                </p>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {inactiveCoupons.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    onEdit={handleStartEdit}
                    onDeactivate={handleDeactivate}
                    isPending={isAnyMutationPending}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}
