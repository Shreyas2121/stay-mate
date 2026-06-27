import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CalendarDays, Home, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useEnsureBookingConversation } from '@/features/messages'
import {
  useCancelHostReservation,
  useCancelMyBooking,
  useCompleteHostReservation,
} from '../api/bookings.api'
import { BookingCard } from './booking-card'
import type { Booking, BookingStatus } from '../types/bookings.types'

type BookingTab = 'all' | BookingStatus

const STATUS_TABS: Array<{ value: BookingTab; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
]

interface BookingsListPageProps {
  title: string
  description: string
  emptyTitle: string
  emptyDescription: string
  mode: 'guest' | 'host'
  bookings?: Booking[]
  isLoading: boolean
  isError: boolean
}

export function BookingsListPage({
  title,
  description,
  emptyTitle,
  emptyDescription,
  mode,
  bookings,
  isLoading,
  isError,
}: BookingsListPageProps) {
  const [activeTab, setActiveTab] = useState<BookingTab>('all')
  const navigate = useNavigate()
  const cancelMyBooking = useCancelMyBooking()
  const cancelHostReservation = useCancelHostReservation()
  const completeHostReservation = useCompleteHostReservation()
  const ensureConversation = useEnsureBookingConversation()
  const confirmedCount =
    bookings?.filter((booking) => booking.status === 'confirmed').length ?? 0
  const completedCount =
    bookings?.filter((booking) => booking.status === 'completed').length ?? 0
  const filteredBookings =
    activeTab === 'all'
      ? bookings
      : bookings?.filter((booking) => booking.status === activeTab)

  const getTabCount = (tab: BookingTab) => {
    if (!bookings) return 0
    if (tab === 'all') return bookings.length
    return bookings.filter((booking) => booking.status === tab).length
  }

  const handleOpenMessages = (bookingId: string) => {
    ensureConversation.mutate(bookingId, {
      onSuccess: (conversation) => {
        void navigate({
          to: mode === 'guest' ? '/guest/messages' : '/host/messages',
          search: { conversationId: conversation.id },
        })
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.error?.message ??
            'Could not open this conversation.',
        )
      },
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-headline-md font-bold text-foreground">
            {title}
          </h2>
          <p className="text-body-sm text-muted-foreground">{description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:min-w-64">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Confirmed
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {confirmedCount}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Completed
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {completedCount}
            </p>
          </div>
        </div>
      </div>

      {bookings && bookings.length > 0 && (
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value
            return (
              <Button
                key={tab.value}
                type="button"
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.value)}
                className="shrink-0 gap-2 rounded-xl"
              >
                {tab.label}
                <span
                  className={
                    isActive
                      ? 'rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[11px]'
                      : 'rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground'
                  }
                >
                  {getTabCount(tab.value)}
                </span>
              </Button>
            )
          })}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading bookings...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Failed to load bookings. Please try again.
        </div>
      )}

      {filteredBookings && filteredBookings.length > 0 && (
        <div className="space-y-5">
          {filteredBookings.map((booking) => {
            const isActionPending =
              (cancelMyBooking.isPending &&
                cancelMyBooking.variables === booking.id) ||
              (cancelHostReservation.isPending &&
                cancelHostReservation.variables === booking.id) ||
              (completeHostReservation.isPending &&
                completeHostReservation.variables === booking.id) ||
              (ensureConversation.isPending &&
                ensureConversation.variables === booking.id)

            return (
              <BookingCard
                key={booking.id}
                booking={booking}
                mode={mode}
                onCancel={
                  mode === 'guest'
                    ? (bookingId) => cancelMyBooking.mutate(bookingId)
                    : undefined
                }
                onHostCancel={
                  mode === 'host'
                    ? (bookingId) => cancelHostReservation.mutate(bookingId)
                    : undefined
                }
                onComplete={
                  mode === 'host'
                    ? (bookingId) => completeHostReservation.mutate(bookingId)
                    : undefined
                }
                onMessage={handleOpenMessages}
                isActionPending={isActionPending}
              />
            )
          })}
        </div>
      )}

      {bookings && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {mode === 'guest' ? (
              <CalendarDays className="size-8" />
            ) : (
              <Home className="size-8" />
            )}
          </div>
          <h3 className="text-lg font-bold text-foreground">{emptyTitle}</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {emptyDescription}
          </p>
        </div>
      )}

      {bookings &&
        bookings.length > 0 &&
        filteredBookings &&
        filteredBookings.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {mode === 'guest' ? (
                <CalendarDays className="size-8" />
              ) : (
                <Home className="size-8" />
              )}
            </div>
            <h3 className="text-lg font-bold text-foreground">
              No {activeTab} bookings
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Choose another status tab to see different bookings.
            </p>
          </div>
        )}
    </div>
  )
}
