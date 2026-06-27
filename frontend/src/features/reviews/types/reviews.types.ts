export type ReviewType = 'guest_to_host' | 'host_to_guest'

export interface ReviewUser {
  id: string
  name?: string | null
  avatarUrl?: string | null
}

export interface ReviewBookingListing {
  id: string
  title: string
}

export interface ReviewBooking {
  id: string
  checkIn: string
  checkOut: string
  listing?: ReviewBookingListing | null
}

export interface Review {
  id: string
  rating: number
  comment?: string | null
  type: ReviewType
  createdAt: string
  updatedAt: string
  booking?: ReviewBooking | null
  reviewer?: ReviewUser | null
  reviewee?: ReviewUser | null
}

export interface PaginatedReviews {
  reviews: Review[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateReviewPayload {
  bookingId: string
  rating: number
  comment?: string
}
