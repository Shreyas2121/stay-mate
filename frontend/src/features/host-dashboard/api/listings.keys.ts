export const hostListingKeys = {
  all: ['host', 'listings'] as const,
  detail: (id: string) => ['host', 'listings', id] as const,
  availability: (id: string) => ['host', 'listings', id, 'availability'] as const,
  amenities: ['amenities'] as const,
}
