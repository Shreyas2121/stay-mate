import { createFileRoute } from '@tanstack/react-router'
import { ListingsPage } from '@/features/listings'

export interface ListingsSearch {
  lat?: number
  lng?: number
  loc?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  page?: number
  sortBy?: string
  minPrice?: number
  maxPrice?: number
  propertyTypes?: string[]
  amenityIds?: string[]
  range?: number
}

export const Route = createFileRoute('/listings')({
  validateSearch: (search: Record<string, unknown>): ListingsSearch => {
    return {
      lat: search.lat ? Number(search.lat) : undefined,
      lng: search.lng ? Number(search.lng) : undefined,
      loc: search.loc ? String(search.loc) : undefined,
      checkIn: search.checkIn ? String(search.checkIn) : undefined,
      checkOut: search.checkOut ? String(search.checkOut) : undefined,
      guests: search.guests ? Number(search.guests) : undefined,
      page: search.page ? Number(search.page) : undefined,
      sortBy: search.sortBy ? String(search.sortBy) : undefined,
      minPrice: search.minPrice ? Number(search.minPrice) : undefined,
      maxPrice: search.maxPrice ? Number(search.maxPrice) : undefined,
      propertyTypes: Array.isArray(search.propertyTypes)
        ? search.propertyTypes.map(String)
        : search.propertyTypes
          ? String(search.propertyTypes).split(',')
          : undefined,
      amenityIds: Array.isArray(search.amenityIds)
        ? search.amenityIds.map(String)
        : search.amenityIds
          ? String(search.amenityIds).split(',')
          : undefined,
      range: search.range ? Number(search.range) : undefined,
    }
  },
  component: ListingsPage,
})
