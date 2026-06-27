import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { BackendResponse } from '@/features/auth'
import type {
  GetListingsFilter,
  Listing,
  PaginatedListings,
} from '../types/listings.types'
import { publicListingKeys } from './listings.keys'

export function usePublicListings(filters: GetListingsFilter) {
  return useQuery({
    queryKey: publicListingKeys.search(filters),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<PaginatedListings>>(
        '/listings',
        {
          params: {
            ...filters,
            propertyTypes: filters.propertyTypes?.join(','),
            amenityIds: filters.amenityIds?.join(','),
          },
        },
      )
      return response.data.data
    },
    placeholderData: keepPreviousData,
  })
}

export function usePublicListingDetail(id: string) {
  return useQuery({
    queryKey: publicListingKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<Listing>>(
        `/listings/${id}`,
      )
      return response.data.data
    },
    enabled: Boolean(id),
  })
}

