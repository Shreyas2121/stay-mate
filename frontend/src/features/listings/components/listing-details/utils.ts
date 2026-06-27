import type { Amenity } from '../../types/listings.types'
import type { ListingPhoto } from '#/features/host-dashboard/types/listing.types'
import { getAssetUrl } from '@/lib/api/urls'

export function imageUrl(photo?: ListingPhoto) {
  if (!photo?.picture) return undefined
  return getAssetUrl(photo.picture)
}

export function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(0)}`
}

export function formatPropertyType(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getLocationSummary(locationText: string) {
  const parts = locationText
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  return parts.slice(-2).join(', ') || locationText
}

export function groupAmenities(amenities: Amenity[]) {
  return amenities.reduce<Record<string, Amenity[]>>((groups, amenity) => {
    const category = amenity.category?.name || 'Other amenities'
    groups[category] = [...(groups[category] || []), amenity]
    return groups
  }, {})
}
