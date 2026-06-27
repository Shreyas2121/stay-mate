import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Search, Loader2 } from 'lucide-react'
import type { UseFormSetValue } from 'react-hook-form'
import type { CreateListingForm } from '../../types/listing.types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLocationAutocomplete } from '@/features/location/hooks/use-location-autocomplete'
import type { LocationSearchResult } from '@/features/location/types/location.types'

// Fix Leaflet default marker icon issue with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006] // NYC center
const DEFAULT_ZOOM = 4

interface Props {
  setValue: UseFormSetValue<CreateListingForm>
  latitude: number | ''
  longitude: number | ''
  locationText: string
  error?: string
}

/** Moves the map view when center changes */
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.2 })
  }, [center, map])
  return null
}

/** Allows clicking on the map to set a marker */
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function LocationPicker({
  setValue,
  latitude,
  longitude,
  locationText,
  error,
}: Props) {
  const {
    containerRef,
    isSearching,
    query,
    results,
    search,
    selectResult,
    showResults,
  } = useLocationAutocomplete()

  const hasMarker = latitude !== '' && longitude !== ''
  const markerPos: [number, number] | null = hasMarker
    ? [latitude, longitude]
    : null

  const handleSelectResult = (result: LocationSearchResult) => {
    setValue('locationText', result.display_name, { shouldValidate: true })
    setValue('latitude', parseFloat(result.lat), { shouldValidate: true })
    setValue('longitude', parseFloat(result.lon), { shouldValidate: true })
    selectResult(result)
  }

  const handleMapClick = (lat: number, lng: number) => {
    setValue('latitude', parseFloat(lat.toFixed(6)), { shouldValidate: true })
    setValue('longitude', parseFloat(lng.toFixed(6)), { shouldValidate: true })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5 text-foreground">
        <MapPin className="size-5 text-primary" />
        <h3 className="text-lg font-bold">Location</h3>
      </div>

      {/* Search Input */}
      <div ref={containerRef} className="relative z-50">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search for an address or city..."
            className="w-full pl-10 pr-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Dropdown Results */}
        {showResults && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            {results.map((r, i) => (
              <Button
                key={i}
                type="button"
                variant="ghost"
                onClick={() => handleSelectResult(r)}
                className="w-full h-auto flex flex-col items-start justify-start text-left px-4 py-3 rounded-none border-b border-border/50 last:border-b-0"
              >
                <span className="text-foreground line-clamp-1">
                  {r.display_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {parseFloat(r.lat).toFixed(4)}, {parseFloat(r.lon).toFixed(4)}
                </span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Location Text (what gets saved) */}
      {locationText && (
        <p className="text-xs text-muted-foreground px-1">📍 {locationText}</p>
      )}

      {/* Map */}
      <div className="rounded-xl border border-border overflow-hidden h-[300px] relative z-0">
        <MapContainer
          center={markerPos ?? DEFAULT_CENTER}
          zoom={markerPos ? 15 : DEFAULT_ZOOM}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {markerPos && (
            <>
              <MapUpdater center={markerPos} />
              <Marker position={markerPos} />
            </>
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        Search for an address above, or click directly on the map to set the
        pin.
      </p>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </section>
  )
}
