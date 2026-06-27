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

const routeApi = getRouteApi('/listings')

export function ListingsPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const initialDateRange =
    search.checkIn && search.checkOut
      ? {
          from: new Date(search.checkIn),
          to: new Date(search.checkOut),
        }
      : undefined

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialDateRange,
  )
  const [guests, setGuests] = useState<number | ''>(search.guests || '')

  useEffect(() => {
    setDateRange(
      search.checkIn && search.checkOut
        ? {
            from: new Date(search.checkIn),
            to: new Date(search.checkOut),
          }
        : undefined,
    )
  }, [search.checkIn, search.checkOut])

  useEffect(() => {
    setGuests(search.guests || '')
  }, [search.guests])

  const { data, isLoading, error } = usePublicListings({
    guestCount: search.guests,
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    page: search.page || 1,
    limit: 10,
    sortBy: search.sortBy || 'newest',
    latitude: search.lat,
    longitude: search.lng,
    range: search.range,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    propertyTypes: search.propertyTypes,
    amenityIds: search.amenityIds,
  })

  const listings = data?.listings || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 0

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          checkIn: dateRange?.from
            ? format(dateRange.from, 'yyyy-MM-dd')
            : undefined,
          checkOut: dateRange?.to
            ? format(dateRange.to, 'yyyy-MM-dd')
            : undefined,
          guests: guests ? Number(guests) : undefined,
          page: 1,
        }),
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [dateRange, guests, navigate])

  const handleSortChange = (value: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        sortBy: value,
        page: 1,
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <div className="sticky top-0 z-10 border-b border-border bg-white py-4 shadow-sm">
        <div className="container-app flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
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
                      const nextSearch = { ...prev }
                      delete nextSearch.lat
                      delete nextSearch.lng
                      delete nextSearch.loc
                      nextSearch.page = 1
                      return nextSearch
                    },
                  })
                }}
                className="w-full"
                inputClassName="h-10 rounded-full border-none bg-slate-100"
              />
            </div>

            <DateSearchField
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="h-10 w-full bg-slate-100 sm:w-60"
              numberOfMonths={isDesktop ? 2 : 1}
            />

            <div className="relative w-full sm:w-36">
              <Users className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Add guests"
                min="1"
                value={guests}
                onChange={(e) =>
                  setGuests(e.target.value ? parseInt(e.target.value, 10) : '')
                }
                className="relative z-0 h-10 rounded-full border-none bg-slate-100 pl-9"
              />
            </div>

            {isDesktop ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-full gap-2 rounded-full border-slate-200 hover:bg-slate-100 sm:w-auto"
                  >
                    <Filter className="size-4" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="mb-4 text-2xl font-bold">
                      Filters
                    </DialogTitle>
                  </DialogHeader>
                  <ListingsFilters />
                </DialogContent>
              </Dialog>
            ) : (
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-full gap-2 rounded-full border-slate-200 hover:bg-slate-100 sm:w-auto"
                  >
                    <Filter className="size-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="h-[85vh] overflow-y-auto rounded-t-2xl"
                >
                  <SheetHeader>
                    <SheetTitle className="mb-4 text-left text-2xl font-bold">
                      Filters
                    </SheetTitle>
                  </SheetHeader>
                  <ListingsFilters />
                </SheetContent>
              </Sheet>
            )}
          </div>

          <div className="flex w-full shrink-0 items-center justify-end gap-2 md:w-auto">
            <span className="hidden text-sm font-medium text-slate-500 lg:inline">
              Sort by
            </span>
            <Select
              value={search.sortBy || 'newest'}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[180px] border-none bg-transparent font-semibold focus:ring-0">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <main className="container-app flex-1 py-8">
        {isLoading && (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <div className="relative size-12">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Searching stays...
            </p>
          </div>
        )}

        {error && (
          <div className="flex h-64 items-center justify-center">
            <p className="rounded-full bg-destructive/10 px-6 py-3 text-sm font-medium text-destructive">
              Failed to load listings. Please try again.
            </p>
          </div>
        )}

        {data && (
          <div className="w-full">
            <h2 className="mb-6 text-xl font-bold text-slate-900">
              {total > 0
                ? `${total} stay${total !== 1 ? 's' : ''} available`
                : 'No stays found'}
            </h2>

            {listings.length > 0 ? (
              <div className="flex flex-col gap-12">
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-white/50 p-12">
                <p className="mb-4 max-w-md text-center font-medium leading-relaxed text-slate-600">
                  No stays found for your current filters. Try adjusting your
                  search criteria.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
