import type { AdminHostStatusFilter, HostProfileTab } from '../types/admin.types'

export const adminKeys = {
  all: ['admin'] as const,
  hostProfiles: ['admin', 'host-profiles'] as const,
  hostProfilesTab: (activeTab: HostProfileTab) => ['admin', 'host-profiles', activeTab] as const,
  hosts: (status: AdminHostStatusFilter) => ['admin', 'hosts', status] as const,
  host: (hostId: string) => ['admin', 'hosts', hostId] as const,
  hostListings: (hostId: string) => ['admin', 'hosts', hostId, 'listings'] as const,
  listing: (listingId: string) => ['admin', 'listings', listingId] as const,
  listingBookings: (listingId: string) => ['admin', 'listings', listingId, 'bookings'] as const,
  coupons: ['admin', 'coupons'] as const,
  coupon: (couponId: string) => ['admin', 'coupons', couponId] as const,
  financeSummary: ['admin', 'finance', 'summary'] as const,
  financeEarnings: ['admin', 'finance', 'earnings'] as const,
  payouts: ['admin', 'payouts'] as const,
}

