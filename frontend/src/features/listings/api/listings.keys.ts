import type { GetListingsFilter } from '../types/listings.types'

export const publicListingKeys = {
  all: ['public-listings'] as const,
  search: (filters: GetListingsFilter) => ['public-listings', 'search', filters] as const,
  detail: (id: string) => ['public-listings', 'detail', id] as const,
}
