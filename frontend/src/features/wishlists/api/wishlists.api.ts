import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { BackendResponse } from '@/features/auth'
import type { WishlistItem, WishlistStatus } from '../types/wishlists.types'
import { wishlistKeys } from './wishlists.keys'

export function useMyWishlist() {
  return useQuery({
    queryKey: wishlistKeys.my,
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<WishlistItem[]>>(
        '/wishlists/my',
      )
      return response.data.data
    },
  })
}

export function useWishlistStatus(listingId: string, enabled = true) {
  return useQuery({
    queryKey: wishlistKeys.listingStatus(listingId),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<WishlistStatus>>(
        `/wishlists/listings/${listingId}`,
      )
      return response.data.data
    },
    enabled: enabled && Boolean(listingId),
  })
}

export function useToggleWishlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (listingId: string) => {
      const response = await apiClient.post<BackendResponse<WishlistStatus>>(
        '/wishlists/toggle',
        { listingId },
      )
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(wishlistKeys.listingStatus(data.listingId), data)
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.my })
    },
  })
}
