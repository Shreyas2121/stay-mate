import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  CalendarDays,
  CheckCircle2,
  Home,
  Loader2,
  MapPin,
  Users,
  CreditCard,
  AlertTriangle,
} from 'lucide-react'
import { Header } from '@/components/layouts/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { apiClient } from '@/lib/api/client'
import { getAssetUrl } from '@/lib/api/urls'
import type { BackendResponse } from '@/features/auth'

interface BookingDetail {
  id: string
  status: string
  guestCount: number
  baseAmount: number
  cleaningFee: number
  serviceFee: number
  discountAmount: number
  totalAmount: number
  checkIn: string
  checkOut: string
  stripeCheckoutSessionId: string | null
  stripePaymentIntentId: string | null
  createdAt: string
  listing: {
    id: string
    title: string
    locationText: string
    photos?: Array<{ id: string; picture: string }>
  }
  coupon?: {
    id: string
    code: string
    discount: number
    discountType: 'percent' | 'flat'
  } | null
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function useBookingDetail(bookingId: string) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<BookingDetail>>(
        `/bookings/${bookingId}`,
      )
      return response.data.data
    },
    enabled: Boolean(bookingId),
    refetchInterval: (query) => {
      // Poll every 3s while booking is still pending (webhook hasn't fired yet)
      const booking = query.state.data
      if (booking && booking.status === 'pending') return 3000
      return false
    },
  })
}

interface Props {
  bookingId: string
}

export function BookingConfirmationPage({ bookingId }: Props) {
  const { data: booking, isLoading, isError } = useBookingDetail(bookingId)

  const heroImage = booking?.listing?.photos?.[0]?.picture
    ? getAssetUrl(booking.listing.photos[0].picture)
    : undefined

  const isConfirmed = booking?.status === 'confirmed'
  const isPending = booking?.status === 'pending'

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#eef4f8_44%,#ffffff_100%)]">
      <Header />

      <main className="container-app py-10 md:py-16">
        {isLoading ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading your booking details...
            </p>
          </div>
        ) : isError || !booking ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 size-8 text-destructive" />
            <h1 className="text-xl font-semibold text-foreground">
              Booking not found
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't find this booking. It may have been cancelled or the
              link is invalid.
            </p>
            <Link to="/">
              <Button variant="outline" className="mt-6">
                <Home className="mr-2 size-4" />
                Back to home
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-8">
            {/* Status Header */}
            <div className="text-center">
              {isConfirmed ? (
                <>
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="size-8 text-emerald-600" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                    Booking Confirmed!
                  </h1>
                  <p className="mt-2 text-base text-muted-foreground">
                    Your stay has been booked. You'll receive a confirmation
                    email shortly.
                  </p>
                </>
              ) : isPending ? (
                <>
                  <Loader2 className="mx-auto mb-4 size-10 animate-spin text-primary" />
                  <h1 className="text-2xl font-bold text-slate-950">
                    Processing Payment...
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Waiting for payment confirmation. This usually takes a few
                    seconds.
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="mx-auto mb-4 size-10 text-amber-500" />
                  <h1 className="text-2xl font-bold text-slate-950">
                    Booking Status: {booking.status}
                  </h1>
                </>
              )}
            </div>

            {/* Booking Details Card */}
            <Card className="overflow-hidden rounded-2xl border-0 shadow-lg">
              {/* Listing Image Header */}
              {heroImage ? (
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={heroImage}
                    alt={booking.listing.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-xl font-semibold text-white">
                      {booking.listing.title}
                    </h2>
                    <div className="mt-1 flex items-center gap-1 text-sm text-white/90">
                      <MapPin className="size-3.5" />
                      {booking.listing.locationText}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-b px-6 pt-6 pb-4">
                  <h2 className="text-xl font-semibold text-slate-950">
                    {booking.listing.title}
                  </h2>
                  {booking.listing.locationText && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {booking.listing.locationText}
                    </div>
                  )}
                </div>
              )}

              <CardContent className="space-y-5 p-6">
                {/* Trip Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Check-in
                      </p>
                      <p className="text-sm font-medium text-slate-950">
                        {format(new Date(booking.checkIn), 'EEE, MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Check-out
                      </p>
                      <p className="text-sm font-medium text-slate-950">
                        {format(new Date(booking.checkOut), 'EEE, MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="size-4 text-muted-foreground" />
                  <p className="text-sm text-slate-700">
                    {booking.guestCount} guest{booking.guestCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Accommodation</span>
                    <span className="font-medium text-slate-900">
                      {formatMoney(booking.baseAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Cleaning fee</span>
                    <span className="font-medium text-slate-900">
                      {formatMoney(booking.cleaningFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Service fee</span>
                    <span className="font-medium text-slate-900">
                      {formatMoney(booking.serviceFee)}
                    </span>
                  </div>
                  {booking.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>
                        Coupon discount
                        {booking.coupon ? ` (${booking.coupon.code})` : ''}
                      </span>
                      <span className="font-medium">
                        -{formatMoney(booking.discountAmount)}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-base font-semibold text-slate-950">
                    Total paid
                  </span>
                  <span className="text-xl font-bold text-slate-950">
                    {formatMoney(booking.totalAmount)}
                  </span>
                </div>

                {/* Booking reference */}
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CreditCard className="size-3.5" />
                    <span>
                      Booking ID:{' '}
                      <span className="font-mono font-medium text-slate-700">
                        {booking.id.slice(0, 8)}
                      </span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/">
                <Button
                  variant="outline"
                  className="h-11 min-w-[180px] rounded-xl"
                >
                  <Home className="mr-2 size-4" />
                  Back to home
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
