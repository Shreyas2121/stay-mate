import { useState } from 'react'
import { format } from 'date-fns'
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  ImageOff,
  Loader2,
  MapPin,
  MessageSquarePlus,
  MessageSquareText,
  TicketPercent,
  Users,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAssetUrl } from '@/lib/api/urls'
import { ReviewDialog, useBookingReviews } from '@/features/reviews'
import type { Booking, BookingStatus } from '../types/bookings.types'

const STATUS_STYLES: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending payment',
    className: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  },
  completed: {
    label: 'Completed',
    className: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-muted text-muted-foreground border-border',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatDate(value: string) {
  return format(new Date(value), 'MMM d, yyyy')
}

function isPastCheckout(value: string) {
  const checkoutDate = new Date(value)
  checkoutDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return checkoutDate <= today
}

interface BookingCardProps {
  booking: Booking
  mode: 'guest' | 'host' | 'admin'
  onCancel?: (bookingId: string) => void
  onHostCancel?: (bookingId: string) => void
  onComplete?: (bookingId: string) => void
  onMessage?: (bookingId: string) => void
  isActionPending?: boolean
}

export function BookingCard({
  booking,
  mode,
  onCancel,
  onHostCancel,
  onComplete,
  onMessage,
  isActionPending,
}: BookingCardProps) {
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const coverPhoto = booking.listing.photos?.[0]
  const status = STATUS_STYLES[booking.status]
  const person = mode === 'guest' ? booking.listing.owner : booking.bookedByUser
  const canGuestCancel =
    mode === 'guest' &&
    (booking.status === 'pending' || booking.status === 'confirmed') &&
    Boolean(onCancel)
  const canHostCancel =
    mode === 'host' && booking.status === 'confirmed' && Boolean(onHostCancel)
  const canHostComplete =
    mode === 'host' &&
    booking.status === 'confirmed' &&
    isPastCheckout(booking.checkOut) &&
    Boolean(onComplete)
  const canMessage =
    mode !== 'admin' && booking.status === 'confirmed' && Boolean(onMessage)
  const canReview = mode === 'guest' && booking.status === 'completed'
  const bookingReviews = useBookingReviews(booking.id, canReview)
  const existingReview = bookingReviews.data?.find(
    (review) => review.type === 'guest_to_host',
  )
  const canSubmitReview = canReview && !existingReview
  const hasActions =
    canGuestCancel || canHostCancel || canHostComplete || canMessage || canReview

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <div className="grid gap-0 md:grid-cols-[280px_1fr]">
        <div className="relative min-h-52 bg-muted md:min-h-full">
          {coverPhoto ? (
            <img
              src={getAssetUrl(coverPhoto.picture)}
              alt={booking.listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-52 flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageOff className="size-8" />
              <span className="text-xs">No photo</span>
            </div>
          )}
          <span
            className={`absolute left-4 top-4 rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {booking.listing.title}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4 shrink-0" />
                  <span className="line-clamp-1">
                    {booking.listing.locationText}
                  </span>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Total
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatMoney(booking.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Dates
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Users className="size-3.5" />
                Guests
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {booking.guestCount} guest{booking.guestCount === 1 ? '' : 's'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <CreditCard className="size-3.5" />
                {mode === 'guest' ? 'Host' : 'Guest'}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground">
                {person?.name || person?.email || 'Unavailable'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <span>Base {formatMoney(booking.baseAmount)}</span>
            <span>Cleaning {formatMoney(booking.cleaningFee)}</span>
            <span>Service {formatMoney(booking.serviceFee)}</span>
            {Number(booking.discountAmount) > 0 && (
              <Badge variant="secondary" className="gap-1">
                <TicketPercent className="size-3" />
                {booking.coupon?.code ?? 'Coupon'} -
                {formatMoney(booking.discountAmount)}
              </Badge>
            )}
          </div>

          {hasActions && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              {canMessage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={isActionPending}
                  onClick={() => onMessage?.(booking.id)}
                >
                  {isActionPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MessageSquareText className="size-4" />
                  )}
                  {mode === 'guest' ? 'Message host' : 'Message guest'}
                </Button>
              )}

              {canReview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={bookingReviews.isLoading || Boolean(existingReview)}
                  onClick={() => setIsReviewOpen(true)}
                >
                  {bookingReviews.isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : existingReview ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <MessageSquarePlus className="size-4" />
                  )}
                  {existingReview ? 'Review submitted' : 'Leave review'}
                </Button>
              )}

              {canGuestCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  disabled={isActionPending}
                  onClick={() => onCancel?.(booking.id)}
                >
                  {isActionPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  Cancel booking
                </Button>
              )}

              {canHostCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  disabled={isActionPending}
                  onClick={() => onHostCancel?.(booking.id)}
                >
                  {isActionPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  Cancel reservation
                </Button>
              )}

              {canHostComplete && (
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  disabled={isActionPending}
                  onClick={() => onComplete?.(booking.id)}
                >
                  {isActionPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Mark completed
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {canSubmitReview && (
        <ReviewDialog
          bookingId={booking.id}
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          subjectLabel="host"
        />
      )}
    </article>
  )
}
