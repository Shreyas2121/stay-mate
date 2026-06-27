import { useEffect } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useLocationAutocomplete } from '@/features/location/hooks/use-location-autocomplete'
import type { LocationSearchResult } from '@/features/location/types/location.types'

interface LocationSearchInputProps {
  onLocationSelect: (lat: string, lon: string) => void
  onLocationClear?: () => void
  initialQuery?: string
  className?: string
  inputClassName?: string
}

export function LocationSearchInput({ onLocationSelect, onLocationClear, initialQuery, className, inputClassName }: LocationSearchInputProps) {
  const {
    containerRef,
    isSearching,
    query: location,
    results,
    search: searchLocations,
    selectResult,
    showExistingResults,
    showResults,
    setQuery,
  } = useLocationAutocomplete()

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
    }
  }, [initialQuery, setQuery])

  const handleLocationChange = (value: string) => {
    searchLocations(value)
    if (value === '' && onLocationClear) {
      onLocationClear()
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setQuery('')
    if (onLocationClear) {
      onLocationClear()
    }
  }

  const handleSelectResult = (result: LocationSearchResult) => {
    selectResult(result)
    onLocationSelect(result.lat, result.lon)
  }

  return (
    <div ref={containerRef} className={`relative flex items-center w-full ${className || ''}`}>
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
      <Input
        type="text"
        placeholder="Where?"
        className={`pl-9 pr-9 bg-slate-100 border-none h-10 rounded-full w-full relative z-0 ${inputClassName || ''}`}
        value={location}
        onChange={(e) => handleLocationChange(e.target.value)}
        onFocus={showExistingResults}
        autoComplete="off"
      />
      
      {isSearching ? (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin z-10" />
      ) : location ? (
        <button 
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors z-10"
        >
          <X className="size-3.5" />
        </button>
      ) : null}

      {/* Dropdown Results */}
      {showResults && results.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full md:w-[300px] bg-white rounded-2xl shadow-xl border border-border overflow-hidden z-50">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectResult(r)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-border/50 last:border-b-0 cursor-pointer flex items-center gap-3"
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
  )
}
