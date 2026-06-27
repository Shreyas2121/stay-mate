import type { Listing } from '@/features/listings'

export interface CheckoutSearch {
  checkIn: string
  checkOut: string
  guests: number
}

export interface CheckoutVerificationResponse {
  success: boolean
  message: string
}

export interface CheckoutPriceBreakdown {
  nights: number
  nightlyRate: number
  baseAmount: number
  cleaningFee: number
  serviceFee: number
  discountAmount: number
  totalAmount: number
}

export interface CheckoutTripSummary {
  listing: Listing
  search: CheckoutSearch
  pricing: CheckoutPriceBreakdown
}

export interface CheckoutCoupon {
  id: string
  code: string
  discountType: 'percent' | 'flat'
  discount: number
  expiryDate: string | null
  isPublic: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  userId: string | null
}

export interface CheckoutCouponPricing {
  listingId: string
  nights: number
  baseAmount: number
  cleaningFee: number
  serviceFee: number
  discountAmount: number
  totalAmount: number
}

export interface CheckoutPublicCouponsResponse {
  booking: CheckoutCouponPricing
  coupons: Array<
    CheckoutCoupon & {
      pricing: CheckoutCouponPricing
    }
  >
}

export interface CheckoutCouponValidationResponse {
  coupon: CheckoutCoupon
  pricing: CheckoutCouponPricing
}
