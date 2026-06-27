import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { BackendResponse } from '@/features/auth'
import type { Booking } from '../types/bookings.types'
import { bookingKeys } from './bookings.keys'

export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.my,
    queryFn: async () => {
      const response =
        await apiClient.get<BackendResponse<Booking[]>>('/bookings/my')
      return response.data.data
    },
  })
}

export function useHostBookings() {
  return useQuery({
    queryKey: bookingKeys.host,
    queryFn: async () => {
      const response =
        await apiClient.get<BackendResponse<Booking[]>>('/bookings/host')
      return response.data.data
    },
  })
}

export function useBookingDetail(bookingId: string) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<Booking>>(
        `/bookings/${bookingId}`,
      )
      return response.data.data
    },
    enabled: Boolean(bookingId),
  })
}

function useBookingAction(
  endpoint: (bookingId: string) => string,
  invalidateKeys: Array<readonly unknown[]>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiClient.post<BackendResponse<Booking>>(
        endpoint(bookingId),
      )
      return response.data.data
    },
    onSuccess: (booking) => {
      for (const queryKey of invalidateKeys) {
        void queryClient.invalidateQueries({ queryKey })
      }
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(booking.id),
      })
    },
  })
}

export function useCancelMyBooking() {
  return useBookingAction((bookingId) => `/bookings/${bookingId}/cancel`, [
    bookingKeys.my,
  ])
}

export function useCancelHostReservation() {
  return useBookingAction(
    (bookingId) => `/bookings/${bookingId}/host-cancel`,
    [bookingKeys.host],
  )
}

export function useCompleteHostReservation() {
  return useBookingAction((bookingId) => `/bookings/${bookingId}/complete`, [
    bookingKeys.host,
  ])
}
