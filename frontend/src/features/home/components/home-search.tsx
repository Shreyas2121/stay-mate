import { type FormEvent, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { format, startOfToday } from 'date-fns'
import { Loader2, MapPin, Search, Users } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  return <div className="hidden h-12 w-px shrink-0 bg-slate-200 lg:block" />
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
        <button
          type="button"
          className="flex min-h-16 flex-1 items-center rounded-lg px-4 py-3 text-left transition-colors hover:bg-slate-100"
        >
          <span className="flex w-full flex-col">
            <span className="text-xs font-bold text-slate-950">{label}</span>
            <span className={cn('text-sm', !value && 'text-slate-500')}>
              {value ? format(value, 'LLL dd') : placeholder}
            </span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
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

export function HomeSearch() {
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

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()

    navigate({
      to: '/listings',
      search: {
        lat: selectedCoords?.lat ? Number(selectedCoords.lat) : undefined,
        lng: selectedCoords?.lon ? Number(selectedCoords.lon) : undefined,
        loc: location || undefined,
        checkIn: dateRange?.from
          ? format(dateRange.from, 'yyyy-MM-dd')
          : undefined,
        checkOut: dateRange?.to
          ? format(dateRange.to, 'yyyy-MM-dd')
          : undefined,
        guests: guests ? Number(guests) : undefined,
      },
    })
  }

  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-6xl rounded-2xl border border-white/20 bg-white p-3 shadow-2xl"
    >
      <div className="grid gap-2 lg:flex lg:items-center">
        <div
          ref={containerRef}
          className="relative flex min-h-16 flex-[1.6] items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-slate-100"
        >
          <MapPin className="size-5 shrink-0 text-slate-700" />
          <div className="flex min-w-0 flex-1 flex-col">
            <label
              htmlFor="location"
              className="text-xs font-bold text-slate-950"
            >
              Where
            </label>
            <div className="relative">
              <Input
                id="location"
                type="text"
                placeholder="Search destinations"
                className="h-6 border-none bg-transparent p-0 text-sm text-slate-950 shadow-none outline-none placeholder:text-slate-500 focus-visible:ring-0"
                value={location}
                onChange={(event) => handleLocationChange(event.target.value)}
                onFocus={showExistingResults}
                autoComplete="off"
              />
              {isSearching && (
                <Loader2 className="absolute right-0 top-1/2 size-3 -translate-y-1/2 animate-spin text-slate-500" />
              )}
            </div>
          </div>

          {showResults && results.length > 0 && (
            <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              {results.map((result) => (
                <button
                  key={`${result.lat}-${result.lon}-${result.display_name}`}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-slate-50"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <MapPin className="size-4 text-slate-600" />
                  </span>
                  <span className="line-clamp-1 text-sm text-slate-700">
                    {result.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <SearchDivider />

        <DateSearchField
          label="Check in"
          placeholder="Add dates"
          value={dateRange?.from}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <SearchDivider />

        <DateSearchField
          label="Check out"
          placeholder="Add dates"
          value={dateRange?.to}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <SearchDivider />

        <div className="flex min-h-16 flex-1 items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-slate-100">
          <Users className="size-5 shrink-0 text-slate-700" />
          <div className="flex min-w-0 flex-1 flex-col">
            <label htmlFor="guests" className="text-xs font-bold text-slate-950">
              Guests
            </label>
            <Input
              id="guests"
              type="number"
              min="1"
              placeholder="Add guests"
              className="h-6 border-none bg-transparent p-0 text-sm text-slate-950 shadow-none outline-none placeholder:text-slate-500 focus-visible:ring-0"
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="h-14 rounded-lg bg-cyan-600 px-6 text-white hover:bg-cyan-700 lg:h-16"
        >
          <Search className="size-5" />
          Search
        </Button>
      </div>
    </form>
  )
}
