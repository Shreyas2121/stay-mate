import { useMutation, useQuery } from '@tanstack/react-query'
import { differenceInCalendarDays } from 'date-fns'
import { apiClient } from '@/lib/api/client'
import type { BackendResponse } from '@/features/auth'
import type { Listing } from '@/features/listings'
import type {
  CheckoutCouponValidationResponse,
  CheckoutPriceBreakdown,
  CheckoutPublicCouponsResponse,
  CheckoutSearch,
  CheckoutVerificationResponse,
} from '../types/checkout.types'

export function useCheckoutListingDetail(listingId: string) {
  return useQuery({
    queryKey: ['checkout', 'listing', listingId],
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<Listing>>(
        `/listings/${listingId}`,
      )
      return response.data.data
    },
    enabled: Boolean(listingId),
  })
}

export function useCheckoutVerification(
  listingId: string,
  search: CheckoutSearch,
) {
  return useQuery({
    queryKey: ['checkout', 'verify', listingId, search],
    queryFn: async () => {
      const response = await apiClient.post<
        BackendResponse<CheckoutVerificationResponse>
      >('/bookings/verify', {
        listingId,
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        guestCount: search.guests,
      })

      return response.data.data
    },
    enabled:
      Boolean(listingId) &&
      Boolean(search.checkIn) &&
      Boolean(search.checkOut) &&
      Number(search.guests) > 0,
    retry: false,
  })
}

export function useCheckoutPublicCoupons(
  listingId: string,
  search: CheckoutSearch,
) {
  return useQuery({
    queryKey: ['checkout', 'coupons', 'public', listingId, search],
    queryFn: async () => {
      const response = await apiClient.get<
        BackendResponse<CheckoutPublicCouponsResponse>
      >(`/coupons/public`, {
        params: {
          listingId,
          checkIn: search.checkIn,
          checkOut: search.checkOut,
          guestCount: search.guests,
        },
      })

      return response.data.data
    },
    enabled:
      Boolean(listingId) &&
      Boolean(search.checkIn) &&
      Boolean(search.checkOut) &&
      Number(search.guests) > 0,
    retry: false,
  })
}

export function useApplyCheckoutCoupon() {
  return useMutation({
    mutationFn: async ({
      listingId,
      search,
      code,
      couponId,
    }: {
      listingId: string
      search: CheckoutSearch
      code?: string
      couponId?: string
    }) => {
      const response = await apiClient.post<
        BackendResponse<CheckoutCouponValidationResponse>
      >('/coupons/validate', {
        listingId,
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        guestCount: search.guests,
        code,
        couponId,
      })

      return response.data.data
    },
  })
}

export function getCheckoutPricing(
  listing: Listing,
  search: CheckoutSearch,
): CheckoutPriceBreakdown {
  const checkInDate = new Date(search.checkIn)
  const checkOutDate = new Date(search.checkOut)
  const nights = Math.max(
    differenceInCalendarDays(checkOutDate, checkInDate),
    0,
  )
  const nightlyRate = Number(listing.price || 0)
  const cleaningFee = Number(listing.cleaningFee || 0)
  const baseAmount = nightlyRate * nights
  const serviceFee = baseAmount * 0.05
  const discountAmount = 0
  const totalAmount = baseAmount + cleaningFee + serviceFee - discountAmount

  return {
    nights,
    nightlyRate,
    baseAmount,
    cleaningFee,
    serviceFee,
    discountAmount,
    totalAmount,
  }
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (params: {
      listingId: string
      checkIn: string
      checkOut: string
      guestCount: number
      couponCode?: string
      couponId?: string
    }) => {
      const response = await apiClient.post<
        BackendResponse<{ clientSecret: string; bookingId: string }>
      >('/payments/create-checkout-session', params)
      return response.data.data
    },
  })
}
