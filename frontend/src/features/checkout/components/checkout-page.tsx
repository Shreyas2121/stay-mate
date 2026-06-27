import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  CreditCard,
  Gift,
  Loader2,
  MapPin,
  ShieldCheck,
  TicketPercent,
  X,
  Users,
} from 'lucide-react'
import { Header } from '@/components/layouts/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useCurrentUser } from '@/features/auth'
import { getAssetUrl } from '@/lib/api/urls'
import {
  getCheckoutPricing,
  useApplyCheckoutCoupon,
  useCheckoutListingDetail,
  useCheckoutPublicCoupons,
  useCheckoutVerification,
  useCreateCheckoutSession,
} from '../api/checkout.api'
import { StripeCheckoutForm } from './stripe-checkout-form'
import type {
  CheckoutCouponValidationResponse,
  CheckoutSearch,
} from '../types/checkout.types'

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatDateLabel(value: string) {
  return format(new Date(value), 'EEE, MMM d, yyyy')
}

function getHeroImage(picture?: string) {
  return picture ? getAssetUrl(picture) : undefined
}

interface Props {
  listingId: string
  search: CheckoutSearch
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  ) {
    const data = error.response.data as {
      message?: string | string[]
      error?: {
        message?: string | string[]
      }
    }

    if (Array.isArray(data.error?.message)) {
      return data.error.message[0] || fallback
    }

    if (typeof data.error?.message === 'string') {
      return data.error.message
    }

    if (Array.isArray(data.message)) {
      return data.message[0] || fallback
    }
    if (typeof data.message === 'string') {
      return data.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export function CheckoutPage({ listingId, search }: Props) {
  const { user, isAuthenticated } = useCurrentUser()
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] =
    useState<CheckoutCouponValidationResponse | null>(null)
  const {
    data: listing,
    isLoading: isListingLoading,
    isError: isListingError,
  } = useCheckoutListingDetail(listingId)
  const {
    data: verification,
    isLoading: isVerificationLoading,
    isError: isVerificationError,
    error: verificationError,
  } = useCheckoutVerification(listingId, search)
  const {
    data: publicCouponsData,
    isLoading: isPublicCouponsLoading,
  } = useCheckoutPublicCoupons(listingId, search)
  const applyCouponMutation = useApplyCheckoutCoupon()
  const createSessionMutation = useCreateCheckoutSession()

  const [checkoutSession, setCheckoutSession] = useState<{
    clientSecret: string
    bookingId: string
  } | null>(null)

  const pricing = listing ? getCheckoutPricing(listing, search) : null
  const displayPricing = appliedCoupon?.pricing ?? pricing
  const heroImage = listing?.photos?.[0]?.picture
    ? getHeroImage(listing.photos[0].picture)
    : undefined
  const publicCoupons = publicCouponsData?.coupons ?? []

  const isLoading = isListingLoading || isVerificationLoading
  const hasAppliedCoupon = Boolean(appliedCoupon)
  const visiblePublicCoupons = publicCoupons.filter(
    (coupon) => coupon.id !== appliedCoupon?.coupon.id,
  )

  const couponHeadline = useMemo(() => {
    if (!appliedCoupon) return null
    return appliedCoupon.coupon.discountType === 'percent'
      ? `${appliedCoupon.coupon.discount}% off`
      : `${formatMoney(appliedCoupon.coupon.discount)} off`
  }, [appliedCoupon])

  const handleApplyCoupon = ({
    code,
    couponId,
  }: {
    code?: string
    couponId?: string
  }) => {
    setCouponError('')

    applyCouponMutation.mutate(
      {
        listingId,
        search,
        code,
        couponId,
      },
      {
        onSuccess: (result) => {
          setAppliedCoupon(result)
          if (result.coupon.code) {
            setCouponCode(result.coupon.code)
          }
        },
        onError: (error) => {
          setCouponError(
            getErrorMessage(error, 'Failed to apply coupon for this booking.'),
          )
        },
      },
    )
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
    setCouponCode('')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#eef4f8_44%,#ffffff_100%)]">
      <Header />

      <main className="container-app py-8 md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/listings/$listingId" params={{ listingId }}>
            <Button variant="ghost" className="-ml-4 gap-2 hover:bg-slate-200/80">
              <ArrowLeft className="size-4" />
              Back to listing
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Preparing your checkout...
            </p>
          </div>
        ) : isListingError || !listing ? (
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 size-8 text-destructive" />
            <h1 className="text-xl font-semibold text-foreground">
              Listing unavailable
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The stay could not be loaded for checkout.
            </p>
          </div>
        ) : isVerificationError ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-destructive/20 bg-white p-8 shadow-sm">
            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              These dates can't be booked
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {getErrorMessage(
                verificationError,
                'The stay failed validation. Please go back and pick different dates or guest count.',
              )}
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/listings/$listingId" params={{ listingId }}>
                <Button>Update selection</Button>
              </Link>
              <Link to="/listings">
                <Button variant="outline">Browse other stays</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <div className="rounded-[32px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="overflow-hidden rounded-[24px] bg-slate-100">
                    {heroImage ? (
                      <img
                        src={heroImage}
                        alt={listing.title}
                        className="h-full min-h-72 w-full object-cover"
                      />
                    ) : (
                      <div className="flex min-h-72 items-center justify-center bg-slate-200 text-sm text-slate-500">
                        Preview unavailable
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between gap-5">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        <ShieldCheck className="size-3.5" />
                        Checkout ready
                      </div>
                      <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                          {listing.title}
                        </h1>
                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="size-4" />
                          {listing.locationText}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-[24px] bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <CalendarDays className="mt-0.5 size-4 text-primary" />
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            Stay dates
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDateLabel(search.checkIn)} to {formatDateLabel(search.checkOut)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="mt-0.5 size-4 text-primary" />
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            Guests
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {search.guests} guest{search.guests !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock3 className="mt-0.5 size-4 text-primary" />
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            Check-in / check-out
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {listing.checkInTime} check-in, {listing.checkOutTime} check-out
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="rounded-[28px] border-white/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="text-xl">Guest details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Booked by
                    </div>
                    <div className="mt-2 text-base font-medium text-slate-900">
                      {isAuthenticated && user ? user.name || 'StayMate guest' : 'Guest'}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {isAuthenticated && user ? user.email : 'Sign in to continue later'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Booking status
                    </div>
                    <div className="mt-2 text-base font-medium text-slate-900">
                      {verification?.message || 'Validated'}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Your dates and guest count passed availability checks.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <aside className="xl:pt-2">
              <Card className="sticky top-24 rounded-[28px] border-slate-200/80 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.10)]">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <CreditCard className="size-4" />
                    Payment summary
                  </div>
                  <CardTitle className="text-2xl">Final booking total</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-4 rounded-2xl border border-border/70 bg-slate-50/80 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <TicketPercent className="size-4 text-primary" />
                      Coupon
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(event) => {
                          setCouponCode(event.target.value.toUpperCase())
                          setCouponError('')
                        }}
                        placeholder="Enter coupon code"
                        className="h-11 rounded-xl bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl"
                        disabled={
                          !couponCode.trim() ||
                          applyCouponMutation.isPending ||
                          hasAppliedCoupon
                        }
                        onClick={() =>
                          handleApplyCoupon({ code: couponCode.trim() })
                        }
                      >
                        {applyCouponMutation.isPending ? 'Applying...' : 'Apply'}
                      </Button>
                    </div>

                    {couponError ? (
                      <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                        {couponError}
                      </div>
                    ) : null}

                    {hasAppliedCoupon ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                              <Gift className="size-4" />
                              Applied: {appliedCoupon!.coupon.code}
                            </div>
                            <div className="mt-1 text-sm text-emerald-700">
                              {couponHeadline} saved {formatMoney(appliedCoupon!.pricing.discountAmount)}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900"
                            onClick={handleRemoveCoupon}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {isPublicCouponsLoading ? (
                      <div className="text-sm text-muted-foreground">
                        Loading available offers...
                      </div>
                    ) : hasAppliedCoupon ? (
                      <div className="text-sm text-muted-foreground">
                        Remove the current coupon to apply a different offer.
                      </div>
                    ) : visiblePublicCoupons.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Available offers
                        </div>
                        <div className="space-y-2">
                          {visiblePublicCoupons.map((coupon) => (
                            <button
                              key={coupon.id}
                              type="button"
                              onClick={() =>
                                handleApplyCoupon({ couponId: coupon.id })
                              }
                              className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-white px-3 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
                            >
                              <div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {coupon.code}
                                </div>
                                <div className="text-xs text-slate-600">
                                  {coupon.discountType === 'percent'
                                    ? `${coupon.discount}% off`
                                    : `${formatMoney(coupon.discount)} off`}
                                </div>
                              </div>
                              <div className="text-sm font-medium text-primary">
                                Apply
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">
                        {formatMoney(pricing!.nightlyRate)} x {displayPricing!.nights} night
                        {displayPricing!.nights !== 1 ? 's' : ''}
                      </span>
                      <span className="font-medium text-slate-900">
                        {formatMoney(displayPricing!.baseAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">Cleaning fee</span>
                      <span className="font-medium text-slate-900">
                        {formatMoney(displayPricing!.cleaningFee)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">Service fee</span>
                      <span className="font-medium text-slate-900">
                        {formatMoney(displayPricing!.serviceFee)}
                      </span>
                    </div>
                    {displayPricing!.discountAmount > 0 ? (
                      <div className="flex items-center justify-between gap-4 text-emerald-700">
                        <span>Coupon discount</span>
                        <span className="font-medium">
                          -{formatMoney(displayPricing!.discountAmount)}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-semibold text-slate-950">Total</span>
                    <span className="text-2xl font-semibold text-slate-950">
                      {formatMoney(displayPricing!.totalAmount)}
                    </span>
                  </div>

                  <Button
                    type="button"
                    className="h-12 w-full rounded-xl text-base"
                    disabled={createSessionMutation.isPending || !isAuthenticated}
                    onClick={() => {
                      createSessionMutation.mutate(
                        {
                          listingId,
                          checkIn: search.checkIn,
                          checkOut: search.checkOut,
                          guestCount: search.guests,
                          couponCode: appliedCoupon
                            ? undefined
                            : couponCode.trim() || undefined,
                          couponId: appliedCoupon?.coupon.id,
                        },
                        {
                          onSuccess: (data) => setCheckoutSession(data),
                          onError: (error) => {
                            toast.error(
                              getErrorMessage(
                                error,
                                'Failed to create checkout session. Please try again.',
                              ),
                            )
                          },
                        },
                      )
                    }}
                  >
                    {createSessionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Creating session...
                      </>
                    ) : (
                      'Proceed to pay'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>

      {/* Stripe Checkout Modal */}
      <Dialog
        open={Boolean(checkoutSession)}
        onOpenChange={(open) => {
          if (!open) setCheckoutSession(null)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0">
          <DialogTitle className="sr-only">Complete Payment</DialogTitle>
          <div className="bg-white p-6 md:p-8">
            <h2 className="mb-6 text-2xl font-semibold text-slate-950">
              Complete your payment
            </h2>
            {checkoutSession && (
              <StripeCheckoutForm clientSecret={checkoutSession.clientSecret} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
