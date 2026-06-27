export const wishlistKeys = {
  all: ['wishlists'] as const,
  my: ['wishlists', 'my'] as const,
  listingStatus: (listingId: string) =>
    ['wishlists', 'listing-status', listingId] as const,
}
