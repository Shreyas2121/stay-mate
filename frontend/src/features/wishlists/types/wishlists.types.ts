import type { Listing } from '@/features/listings'

export interface WishlistItem {
  id: string
  createdAt: string
  listing: Listing
}

export interface WishlistStatus {
  listingId: string
  isWishlisted: boolean
}
