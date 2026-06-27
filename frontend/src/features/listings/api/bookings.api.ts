import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { BackendResponse } from '@/features/auth'

export interface VerifyBookingRequest {
  listingId: string
  checkIn: string
  checkOut: string
  guestCount: number
}

export interface VerifyBookingResponse {
  success: boolean
  message: string
}

export function useVerifyBooking() {
  return useMutation({
    mutationFn: async (data: VerifyBookingRequest) => {
      const response = await apiClient.post<BackendResponse<VerifyBookingResponse>>(
        '/bookings/verify',
        data
      )
      return response.data.data
    },
  })
}
