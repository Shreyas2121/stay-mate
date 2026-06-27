import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { BackendResponse } from '@/features/auth'
import { bookingKeys } from '@/features/bookings/api/bookings.keys'
import type {
  CreateReviewPayload,
  PaginatedReviews,
  Review,
  ReviewType,
} from '../types/reviews.types'
import { reviewKeys } from './reviews.keys'

interface ReviewsQueryOptions {
  page?: number
  limit?: number
  type?: ReviewType
  enabled?: boolean
}

export function useListingReviews(
  listingId: string,
  options: ReviewsQueryOptions = {},
) {
  const { page = 1, limit = 6 } = options

  return useQuery({
    queryKey: reviewKeys.listing(listingId),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<PaginatedReviews>>(
        `/reviews/listings/${listingId}`,
        { params: { page, limit } },
      )
      return response.data.data
    },
    enabled: Boolean(listingId) && (options.enabled ?? true),
  })
}

export function useBookingReviews(bookingId: string, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.booking(bookingId),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<Review[]>>(
        `/reviews/bookings/${bookingId}`,
      )
      return response.data.data
    },
    enabled: Boolean(bookingId) && enabled,
  })
}

export function useUserReceivedReviews(
  userId: string,
  options: ReviewsQueryOptions = {},
) {
  const { page = 1, limit = 10, type } = options

  return useQuery({
    queryKey: reviewKeys.userReceived(userId, type),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<PaginatedReviews>>(
        `/reviews/users/${userId}/received`,
        { params: { page, limit, type } },
      )
      return response.data.data
    },
    enabled: Boolean(userId) && (options.enabled ?? true),
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateReviewPayload) => {
      const response = await apiClient.post<BackendResponse<Review>>(
        '/reviews',
        payload,
      )
      return response.data.data
    },
    onSuccess: (review) => {
      if (review.booking?.id) {
        void queryClient.invalidateQueries({
          queryKey: reviewKeys.booking(review.booking.id),
        })
      }
      if (review.booking?.listing?.id) {
        void queryClient.invalidateQueries({
          queryKey: reviewKeys.listing(review.booking.listing.id),
        })
      }
      if (review.reviewee?.id) {
        void queryClient.invalidateQueries({
          queryKey: reviewKeys.userReceived(review.reviewee.id),
        })
      }
      void queryClient.invalidateQueries({ queryKey: bookingKeys.my })
      void queryClient.invalidateQueries({ queryKey: bookingKeys.host })
    },
  })
}
