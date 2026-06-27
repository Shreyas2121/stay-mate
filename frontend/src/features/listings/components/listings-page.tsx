import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { Header } from '@/components/layouts/Header'
import { usePublicListings } from '../api/listings.api'
import { ListingsFilters } from './listings-filters'
import { ListingCard } from './listing-card'
import { LocationSearchInput } from '@/components/search/LocationSearchInput'
import { DateSearchField } from '@/components/search/DateSearchField'
import { Pagination } from '@/components/ui/pagination'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Filter, Users } from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'

const routeApi = getRouteApi('/listings')

export function ListingsPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  
  // Date range needs to be parsed from search params
  const initialDateRange = search.checkIn && search.checkOut ? {
    from: new Date(search.checkIn),
    to: new Date(search.checkOut)
  } : undefined
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange)
  
  const [guests, setGuests] = useState<number | ''>(search.guests || '')

  const { data, isLoading, error } = usePublicListings({
    guestCount: search.guests,
    page: search.page || 1,
    limit: 10,
    sortBy: search.sortBy || 'newest',
    latitude: search.lat,
    longitude: search.lng,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    propertyTypes: search.propertyTypes,
  })

  const listings = data?.listings || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 0

  useEffect(() => {
    if (data) {
      console.log('Listings search result:', data)
    }
  }, [data])

  // Apply filters automatically when dateRange or guests change (basic debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          checkIn: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
          checkOut: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
          guests: guests ? Number(guests) : undefined,
          page: 1, // Reset to page 1 on filter change
        }),
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [dateRange, guests, navigate])

  const handleSortChange = (value: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        sortBy: value,
        page: 1, // Reset to page 1 on sort change
      }),
    })
  }

  const handlePageChange = (page: number) => {
    navigate({
      search: (prev) => ({
        ...prev,
        page,
      }),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      {/* Top Bar for Primary Filters */}
      <div className="bg-white border-b border-border sticky top-0 z-10 shadow-sm py-4">
        <div className="container-app flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Primary Filters Group */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Location */}
            <div className="w-full sm:w-64">
              <LocationSearchInput 
                initialQuery={search.loc}
                onLocationSelect={(lat, lng) => {
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      lat: Number(lat),
                      lng: Number(lng),
                      page: 1,
                    }),
                  })
                }}
                onLocationClear={() => {
                  navigate({
                    search: (prev) => {
                      const newSearch = { ...prev }
                      delete newSearch.lat
                      delete newSearch.lng
                      delete newSearch.loc
                      newSearch.page = 1
                      return newSearch
                    },
                  })
                }}
                className="w-full"
                inputClassName="bg-slate-100 border-none h-10 rounded-full"
              />
            </div>

            {/* Dates */}
            <DateSearchField
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="w-full sm:w-60 h-10 bg-slate-100"
              numberOfMonths={isDesktop ? 2 : 1}
            />

            {/* Guests */}
            <div className="relative w-full sm:w-36">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
              <Input 
                type="number" 
                placeholder="Add guests" 
                min="1"
                value={guests}
                onChange={(e) => setGuests(e.target.value ? parseInt(e.target.value) : '')}
                className="pl-9 bg-slate-100 border-none h-10 rounded-full relative z-0"
              />
            </div>
            
            {/* Secondary Filters Button */}
            {isDesktop ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-10 rounded-full gap-2 border-slate-200 w-full sm:w-auto hover:bg-slate-100">
                    <Filter className="size-4" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold mb-4">Filters</DialogTitle>
                  </DialogHeader>
                  <ListingsFilters />
                </DialogContent>
              </Dialog>
            ) : (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-10 rounded-full gap-2 border-slate-200 w-full sm:w-auto hover:bg-slate-100">
                    <Filter className="size-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-bold mb-4 text-left">Filters</SheetTitle>
                  </SheetHeader>
                  <ListingsFilters />
                </SheetContent>
              </Sheet>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <span className="text-sm font-medium text-slate-500 hidden lg:inline">Sort by</span>
            <Select value={search.sortBy || 'newest'} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px] bg-transparent border-none font-semibold focus:ring-0">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="most-reviewed">Most Reviewed</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <main className="flex-1 container-app py-8">
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative size-12">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
              <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Searching stays...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm font-medium text-destructive bg-destructive/10 px-6 py-3 rounded-full">
              Failed to load listings. Please try again.
            </p>
          </div>
        )}

        {data && (
          <div className="w-full">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {total > 0 ? `${total} stay${total !== 1 ? 's' : ''} available` : 'No stays found'}
            </h2>
            
            {listings.length > 0 ? (
              <div className="flex flex-col gap-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
                
                <Pagination 
                  currentPage={search.page || 1} 
                  totalPages={totalPages} 
                  onPageChange={handlePageChange} 
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-2xl p-12 bg-white/50">
                <p className="text-slate-600 mb-4 text-center max-w-md font-medium leading-relaxed">
                  No stays found for your current filters. Try adjusting your search criteria.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
