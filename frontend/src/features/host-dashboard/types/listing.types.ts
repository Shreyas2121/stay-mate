export enum PropertyType {
  Apartment = 'apartment',
  Villa = 'villa',
  Cabin = 'cabin',
  Room = 'room',
}

export enum ListingStatus {
  Draft = 'draft',
  Active = 'active',
  Closed = 'closed',
}

export interface CreateListingForm {
  title: string
  description: string
  price: number | ''
  locationText: string
  latitude: number | ''
  longitude: number | ''
  maxGuests: number | ''
  bedrooms: number | ''
  bathrooms: number | ''
  cleaningFee: number | ''
  propertyType: PropertyType | ''
  minNights: number | ''
  maxNights: number | ''
  checkInTime: string
  checkOutTime: string
  additionalInfo: string
  amenityIds: string[]
  customAmenities: string[]
  photoOrder?: string[]
}

export interface AmenityCategory {
  id: string
  name: string
  description: string | null
  amenities: Amenity[]
}

export interface Amenity {
  id: string
  name: string
  icon: string | null
  isSystem: boolean
  category?: {
    id: string
    name: string
  } | null
}

export interface Listing {
  id: string
  title: string
  description: string
  price: number
  locationText: string
  latitude: number
  longitude: number
  maxGuests: number
  bedrooms: number
  bathrooms: number
  status: ListingStatus
  cleaningFee: number
  propertyType: PropertyType
  minNights: number
  maxNights: number
  checkInTime: string
  checkOutTime: string
  additionalInfo: string | null
  photos: ListingPhoto[]
  amenities: Amenity[]
  createdAt: string
  updatedAt: string
}

export interface ListingPhoto {
  id: string
  picture: string
  label?: string | null
  displayOrder: number
}

export interface AvailabilityBlock {
  id: string
  startDate: string
  endDate: string
  reason: string | null
}
