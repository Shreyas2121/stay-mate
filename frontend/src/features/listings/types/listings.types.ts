import { type Listing, type AmenityCategory, type Amenity } from '@/features/host-dashboard/types/listing.types'

export type { Listing, AmenityCategory, Amenity }

export interface GetListingsFilter {
  guestCount?: number
  page?: number
  limit?: number
  sortBy?: string
  latitude?: number
  longitude?: number
  range?: number
  minPrice?: number
  maxPrice?: number
  propertyTypes?: string[]
}

export interface PaginatedListings {
  listings: Listing[]
  total: number
  page: number
  limit: number
  totalPages: number
}
