import { useState } from 'react'
import { differenceInCalendarDays, format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { getRouteApi, Link } from '@tanstack/react-router'
import { Loader2, Users } from 'lucide-react'
import { DateSearchField } from '@/components/search/DateSearchField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ListingRatingSummary } from '@/features/reviews'
import { useVerifyBooking } from '../../api/bookings.api'
import type { Listing } from '../../types/listings.types'
import { formatMoney } from './utils'

const routeApi = getRouteApi('/listings_/$listingId')

export function BookingCard({
  listing,
  isAuthenticated,
}: {
  listing: Listing
  isAuthenticated: boolean
}) {
  const navigate = routeApi.useNavigate()
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [guests, setGuests] = useState<number | ''>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const { mutate: verifyBooking, isPending } = useVerifyBooking()

  const nights =
    dateRange?.from && dateRange.to
      ? Math.max(differenceInCalendarDays(dateRange.to, dateRange.from), 0)
      : 0
  const subtotal = nights * Number(listing.price || 0)
  const cleaningFee = Number(listing.cleaningFee || 0)
  const total = subtotal + (nights > 0 ? cleaningFee : 0)
  const exceedsGuests = Number(guests || 0) > listing.maxGuests
  const belowMinimum = nights > 0 && nights < listing.minNights
  const aboveMaximum = nights > 0 && nights > listing.maxNights
  const canBook =
    nights > 0 &&
    Boolean(guests) &&
    !exceedsGuests &&
    !belowMinimum &&
    !aboveMaximum

  const handleBookNow = () => {
    if (!dateRange?.from || !dateRange?.to || !guests) return
    setErrorMessage('')

    const checkIn = format(dateRange.from, 'yyyy-MM-dd')
    const checkOut = format(dateRange.to, 'yyyy-MM-dd')

    verifyBooking(
      {
        listingId: listing.id,
        checkIn,
        checkOut,
        guestCount: Number(guests),
      },
      {
        onSuccess: () => {
          navigate({
            to: '/checkout/$listingId',
            params: { listingId: listing.id },
            search: {
              checkIn,
              checkOut,
              guests: Number(guests),
            },
          })
        },
        onError: (error: any) => {
          setErrorMessage(
            error.response?.data?.message || 'Failed to verify booking dates.'
          )
        },
      }
    )
  }

  return (
    <Card className="sticky top-24 rounded-2xl border-border/80 shadow-lg">
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {formatMoney(listing.price)}
              <span className="text-base font-medium text-muted-foreground">
                {' '}
                / night
              </span>
            </p>
            <div className="mt-1">
              <ListingRatingSummary listingId={listing.id} />
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full">
            Active
          </Badge>
        </div>

        <div className="space-y-3">
          <DateSearchField
            dateRange={dateRange}
            onDateRangeChange={(range) => {
              setDateRange(range)
              setErrorMessage('')
            }}
            className="h-12 w-full rounded-xl border border-border bg-white hover:bg-slate-50"
            numberOfMonths={1}
          />

          <div className="relative">
            <Users className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              min="1"
              max={listing.maxGuests}
              placeholder={`Guests up to ${listing.maxGuests}`}
              value={guests}
              onChange={(event) => {
                setGuests(event.target.value ? Number(event.target.value) : '')
                setErrorMessage('')
              }}
              className="h-12 rounded-xl border-border bg-white pl-10"
            />
          </div>
        </div>

        {(exceedsGuests || belowMinimum || aboveMaximum) && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {exceedsGuests
              ? `This stay allows up to ${listing.maxGuests} guests.`
              : belowMinimum
                ? `Minimum stay is ${listing.minNights} night${listing.minNights !== 1 ? 's' : ''}.`
                : `Maximum stay is ${listing.maxNights} night${listing.maxNights !== 1 ? 's' : ''}.`}
          </p>
        )}

        {errorMessage && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {errorMessage}
          </p>
        )}

        {isAuthenticated ? (
          <Button
            className="h-12 w-full rounded-xl text-base"
            disabled={!canBook || isPending}
            onClick={handleBookNow}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isPending ? 'Verifying...' : 'Book now'}
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-border/70 bg-slate-50 p-4 text-center">
            <p className="text-sm font-medium text-slate-700">
              Log in to book this stay.
            </p>
            <Link to="/login">
              <Button className="h-12 w-full rounded-xl text-base">
                Log in to book
              </Button>
            </Link>
          </div>
        )}

        <Separator />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">
              {formatMoney(listing.price)} x {nights || 0} night
              {nights !== 1 ? 's' : ''}
            </span>
            <span className="font-medium">{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">Cleaning fee</span>
            <span className="font-medium">
              {nights > 0 ? formatMoney(cleaningFee) : '$0'}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between gap-4 text-base font-bold">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

