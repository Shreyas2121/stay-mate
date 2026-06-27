import type { Listing } from '@/features/listings'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'rejected'

export interface BookingUser {
  id: string
  name?: string | null
  email: string
}

export interface BookingCoupon {
  id: string
  code: string
  discountType: 'percent' | 'flat'
  discount: number
}

export interface BookingListing extends Listing {
  owner?: BookingUser
}

export interface Booking {
  id: string
  listing: BookingListing
  bookedByUser?: BookingUser
  guestCount: number
  status: BookingStatus
  baseAmount: number
  cleaningFee: number
  serviceFee: number
  discountAmount: number
  totalAmount: number
  stripePaymentIntentId?: string | null
  stripeCheckoutSessionId?: string | null
  checkIn: string
  checkOut: string
  coupon?: BookingCoupon | null
  createdAt: string
  updatedAt: string
}
