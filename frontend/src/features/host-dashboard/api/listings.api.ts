import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { BackendResponse } from '@/features/auth'
import type {
  AmenityCategory,
  AvailabilityBlock,
  CreateListingForm,
  Listing,
  ListingStatus,
} from '../types/listing.types'
import { hostListingKeys } from './listings.keys'

// ─── Queries ──────────────────────────────────────────────────

/** Fetch all listings owned by the current host */
export function useHostListings() {
  return useQuery({
    queryKey: hostListingKeys.all,
    queryFn: async () => {
      const response =
        await apiClient.get<BackendResponse<Listing[]>>('/listings/my')
      return response.data.data
    },
  })
}

/** Fetch a single listing by ID */
export function useListingDetail(id: string) {
  return useQuery({
    queryKey: hostListingKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<Listing>>(
        `/listings/${id}`,
      )
      return response.data.data
    },
    enabled: !!id,
  })
}

/** Fetch all system amenity categories with their amenities */
export function useAmenities() {
  return useQuery({
    queryKey: hostListingKeys.amenities,
    queryFn: async () => {
      const response =
        await apiClient.get<BackendResponse<AmenityCategory[]>>('/amenities')
      return response.data.data
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function useListingAvailability(id: string) {
  return useQuery({
    queryKey: hostListingKeys.availability(id),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<AvailabilityBlock[]>>(
        `/availability/my-listings/${id}/blocks`,
      )
      return response.data.data
    },
    enabled: !!id,
  })
}

// ─── Mutations ────────────────────────────────────────────────

/** Builds a FormData body from form values + photos */
function buildListingFormData(
  formData: CreateListingForm,
  status: ListingStatus,
  photos: File[],
  deletedPhotoIds?: string[],
): FormData {
  const body = new FormData()

  body.append('title', formData.title)
  body.append('description', formData.description)
  body.append('price', String(formData.price))
  body.append('locationText', formData.locationText)
  body.append('latitude', String(formData.latitude))
  body.append('longitude', String(formData.longitude))
  body.append('maxGuests', String(formData.maxGuests))
  body.append('bedrooms', String(formData.bedrooms))
  body.append('bathrooms', String(formData.bathrooms))
  body.append('cleaningFee', String(formData.cleaningFee))
  body.append('propertyType', String(formData.propertyType))
  body.append('minNights', String(formData.minNights))
  body.append('maxNights', String(formData.maxNights))
  body.append('checkInTime', formData.checkInTime)
  body.append('checkOutTime', formData.checkOutTime)
  body.append('status', status)

  if (formData.additionalInfo) {
    body.append('additionalInfo', formData.additionalInfo)
  }

  body.append('amenityIds', JSON.stringify(formData.amenityIds))
  body.append('customAmenities', JSON.stringify(formData.customAmenities))
  if (formData.photoOrder && formData.photoOrder.length > 0) {
    body.append('photoOrder', JSON.stringify(formData.photoOrder))
  }

  if (deletedPhotoIds && deletedPhotoIds.length > 0) {
    body.append('deletedPhotoIds', JSON.stringify(deletedPhotoIds))
  }

  for (const photo of photos) {
    body.append('photos', photo)
  }

  return body
}

interface CreateListingParams {
  formData: CreateListingForm
  status: ListingStatus
  photos: File[]
}

/** Create a new listing (multipart/form-data with photos) */
export function useCreateListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ formData, status, photos }: CreateListingParams) => {
      const body = buildListingFormData(formData, status, photos)
      const response = await apiClient.post<BackendResponse<Listing>>(
        '/listings',
        body,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      return response.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hostListingKeys.all })
    },
  })
}

interface UpdateListingParams {
  id: string
  formData: CreateListingForm
  status: ListingStatus
  newPhotos: File[]
  deletedPhotoIds: string[]
}

/** Update an existing listing (multipart/form-data with photos) */
export function useUpdateListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      formData,
      status,
      newPhotos,
      deletedPhotoIds,
    }: UpdateListingParams) => {
      const body = buildListingFormData(
        formData,
        status,
        newPhotos,
        deletedPhotoIds,
      )
      const response = await apiClient.patch<BackendResponse<Listing>>(
        `/listings/${id}`,
        body,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: hostListingKeys.all })
      void queryClient.invalidateQueries({
        queryKey: hostListingKeys.detail(variables.id),
      })
    },
  })
}

interface CreateAvailabilityBlockParams {
  listingId: string
  startDate: string
  endDate: string
  reason?: string
}

export function useCreateAvailabilityBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listingId,
      startDate,
      endDate,
      reason,
    }: CreateAvailabilityBlockParams) => {
      const response = await apiClient.post<BackendResponse<AvailabilityBlock>>(
        `/availability/my-listings/${listingId}/blocks`,
        {
          startDate,
          endDate,
          reason: reason?.trim() || undefined,
        },
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: hostListingKeys.availability(variables.listingId),
      })
    },
  })
}

export function useDeleteAvailabilityBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listingId,
      blockId,
    }: {
      listingId: string
      blockId: string
    }) => {
      await apiClient.delete(`/availability/blocks/${blockId}`)
      return { listingId }
    },
    onSuccess: ({ listingId }) => {
      void queryClient.invalidateQueries({
        queryKey: hostListingKeys.availability(listingId),
      })
    },
  })
}
