import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MapPin, Users, Search, Loader2 } from 'lucide-react'
import { format, startOfToday } from 'date-fns'
import type { DateRange } from 'react-day-picker'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLocationAutocomplete } from '@/features/location/hooks/use-location-autocomplete'
import type { LocationSearchResult } from '@/features/location/types/location.types'
import { cn } from '@/lib/utils'

interface DateSearchFieldProps {
  label: string
  placeholder: string
  value?: Date
  dateRange?: DateRange
  onDateRangeChange: (dateRange: DateRange | undefined) => void
}

const today = startOfToday()

function SearchDivider() {
  return <div className="w-[1px] h-10 bg-slate-200 mx-2 shrink-0" />
}

function DateSearchField({
  label,
  placeholder,
  value,
  dateRange,
  onDateRangeChange,
}: DateSearchFieldProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex-1 flex items-center gap-3 px-6 py-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer group">
          <div className="flex flex-col w-full">
            <span className="text-xs font-bold text-slate-900">{label}</span>
            <span className={cn('text-sm', !value && 'text-slate-500')}>
              {value ? format(value, 'LLL dd') : placeholder}
            </span>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="center"
        avoidCollisions={false}
      >
        <Calendar
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onDateRangeChange}
          numberOfMonths={2}
          disabled={(date) => date < today}
        />
      </PopoverContent>
    </Popover>
  )
}

export function HomeHero() {
  const navigate = useNavigate()
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: string
    lon: string
  } | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [guests, setGuests] = useState('')
  const {
    containerRef,
    isSearching,
    query: location,
    results,
    search: searchLocations,
    selectResult,
    showExistingResults,
    showResults,
  } = useLocationAutocomplete()

  const handleLocationChange = (value: string) => {
    setSelectedCoords(null)
    searchLocations(value)
  }

  const handleSelectResult = (result: LocationSearchResult) => {
    setSelectedCoords({ lat: result.lat, lon: result.lon })
    selectResult(result)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    let checkInStr = undefined
    let checkOutStr = undefined

    if (dateRange?.from) {
      checkInStr = format(dateRange.from, 'yyyy-MM-dd')
    }
    if (dateRange?.to) {
      checkOutStr = format(dateRange.to, 'yyyy-MM-dd')
    }

    navigate({
      to: '/listings',
      search: {
        lat: selectedCoords?.lat ? Number(selectedCoords.lat) : undefined,
        lng: selectedCoords?.lon ? Number(selectedCoords.lon) : undefined,
        loc: location ? location : undefined,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        guests: guests ? Number(guests) : undefined,
      },
    })
  }

  return (
    <div className="relative h-[600px] w-full bg-slate-900 flex flex-col justify-center items-center">
      {/* Background Image Setup */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: "url('/images/hero-bg.png')" }}
      />

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 text-center drop-shadow-lg">
          Find your perfect stay
        </h1>

        {/* Search Bar matching the image structure */}
        <form
          onSubmit={handleSearch}
          className="w-full bg-white rounded-full p-2 flex items-center shadow-2xl relative"
        >
          {/* Where Section */}
          <div
            ref={containerRef}
            className="flex-[1.5] flex items-center gap-3 px-6 py-2 hover:bg-slate-100 rounded-full transition-colors cursor-text group relative"
          >
            <MapPin className="w-5 h-5 text-slate-700 shrink-0" />
            <div className="flex flex-col w-full relative">
              <label
                htmlFor="location"
                className="text-xs font-bold text-slate-900 cursor-pointer"
              >
                Where
              </label>
              <div className="relative w-full">
                <Input
                  id="location"
                  type="text"
                  placeholder="Search destinations"
                  className="bg-transparent border-none focus-visible:ring-0 shadow-none outline-none text-sm text-slate-900 placeholder:text-slate-500 w-full p-0 h-5"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={showExistingResults}
                  autoComplete="off"
                />
                {isSearching && (
                  <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 size-3 text-muted-foreground animate-spin" />
                )}
              </div>
            </div>

            {/* Dropdown Results */}
            {showResults && results.length > 0 && (
              <div className="absolute top-[calc(100%+16px)] left-0 w-full bg-white rounded-3xl shadow-xl border border-border overflow-hidden z-50">
                {results.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectResult(r)}
                    className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors border-b border-border/50 last:border-b-0 cursor-pointer flex items-center gap-3"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 shrink-0">
                      <MapPin className="size-4 text-slate-600" />
                    </div>
                    <span className="text-sm text-slate-700 line-clamp-1">
                      {r.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <SearchDivider />

          {/* Check in Section */}
          <DateSearchField
            label="Check in"
            placeholder="Add dates"
            value={dateRange?.from}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          <SearchDivider />

          {/* Check out Section */}
          <DateSearchField
            label="Check out"
            placeholder="Add dates"
            value={dateRange?.to}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          <SearchDivider />

          {/* Guests Section */}
          <div className="flex-1 flex items-center gap-3 px-6 py-2 hover:bg-slate-100 rounded-full transition-colors cursor-text group">
            <Users className="w-5 h-5 text-slate-700 shrink-0" />
            <div className="flex flex-col w-full">
              <label
                htmlFor="guests"
                className="text-xs font-bold text-slate-900 cursor-pointer"
              >
                Guests
              </label>
              <Input
                id="guests"
                type="number"
                min="1"
                placeholder="Add guests"
                className="bg-transparent border-none focus-visible:ring-0 shadow-none outline-none text-sm text-slate-900 placeholder:text-slate-500 w-full p-0 h-5"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              />
            </div>
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            className="ml-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 h-auto flex items-center gap-2 font-semibold transition-colors shrink-0 shadow-none"
          >
            <Search className="w-5 h-5" />
            <span>Search</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
