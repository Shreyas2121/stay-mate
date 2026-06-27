import type { ReviewType } from '../types/reviews.types'

export const reviewKeys = {
  all: ['reviews'] as const,
  listing: (listingId: string) => ['reviews', 'listing', listingId] as const,
  booking: (bookingId: string) => ['reviews', 'booking', bookingId] as const,
  userReceived: (userId: string, type?: ReviewType) =>
    ['reviews', 'user-received', userId, type ?? 'all'] as const,
}
