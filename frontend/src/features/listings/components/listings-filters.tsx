import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { useAmenities } from '@/features/host-dashboard/api/listings.api'
import { PropertyType } from '@/features/host-dashboard/types/listing.types'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

const routeApi = getRouteApi('/listings')

export function ListingsFilters() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const [radius, setRadius] = useState<number[]>([search.range || 50])
  const [priceRange, setPriceRange] = useState<number[]>([
    search.minPrice || 10,
    search.maxPrice || 1000,
  ])
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(
    search.propertyTypes || [],
  )
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    search.amenityIds || [],
  )

  const { data: amenityCategories, isLoading: isLoadingAmenities } =
    useAmenities()

  useEffect(() => {
    setRadius([search.range || 50])
    setPriceRange([search.minPrice || 10, search.maxPrice || 1000])
    setSelectedPropertyTypes(search.propertyTypes || [])
    setSelectedAmenities(search.amenityIds || [])
  }, [
    search.range,
    search.minPrice,
    search.maxPrice,
    search.propertyTypes,
    search.amenityIds,
  ])

  const propertyTypes = [
    { id: PropertyType.Apartment, label: 'Apartment' },
    { id: PropertyType.Villa, label: 'Villa' },
    { id: PropertyType.Cabin, label: 'Cabin' },
    { id: PropertyType.Room, label: 'Room' },
  ]

  const handlePropertyTypeChange = (id: string, checked: boolean) => {
    setSelectedPropertyTypes((current) =>
      checked ? [...current, id] : current.filter((typeId) => typeId !== id),
    )
  }

  const handleAmenityChange = (id: string, checked: boolean) => {
    setSelectedAmenities((current) =>
      checked
        ? [...current, id]
        : current.filter((amenityId) => amenityId !== id),
    )
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          range: radius[0] !== 50 ? radius[0] : undefined,
          minPrice: priceRange[0] !== 10 ? priceRange[0] : undefined,
          maxPrice: priceRange[1] !== 1000 ? priceRange[1] : undefined,
          propertyTypes:
            selectedPropertyTypes.length > 0
              ? selectedPropertyTypes
              : undefined,
          amenityIds:
            selectedAmenities.length > 0 ? selectedAmenities : undefined,
          page: 1,
        }),
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [radius, priceRange, selectedPropertyTypes, selectedAmenities, navigate])

  return (
    <div className="w-full space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Search Radius</Label>
          <span className="text-sm text-muted-foreground">{radius[0]} km</span>
        </div>
        <Slider
          defaultValue={[50]}
          max={100}
          min={1}
          step={1}
          value={radius}
          onValueChange={setRadius}
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Price Range</Label>
          <span className="text-sm text-muted-foreground">
            ${priceRange[0]} - ${priceRange[1]}
          </span>
        </div>
        <Slider
          defaultValue={[10, 500]}
          max={1000}
          min={10}
          step={10}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mt-2"
        />
        <div className="flex items-center gap-4 pt-2">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Min price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) =>
                  setPriceRange([
                    Math.max(0, parseInt(e.target.value) || 0),
                    priceRange[1],
                  ])
                }
                className="bg-background pl-7"
              />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Max price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([
                    priceRange[0],
                    Math.max(0, parseInt(e.target.value) || 0),
                  ])
                }
                className="bg-background pl-7"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label className="text-base font-semibold">Property Type</Label>
        <div className="space-y-3">
          {propertyTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-3">
              <Checkbox
                id={`property-${type.id}`}
                checked={selectedPropertyTypes.includes(type.id)}
                onCheckedChange={(checked) =>
                  handlePropertyTypeChange(type.id, checked as boolean)
                }
              />
              <Label
                htmlFor={`property-${type.id}`}
                className="cursor-pointer text-sm font-normal leading-none"
              >
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label className="text-base font-semibold">Amenities</Label>
        {isLoadingAmenities ? (
          <div className="flex items-center space-x-2 py-4 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Loading amenities...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {amenityCategories?.map((category) => (
              <div key={category.id} className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700">
                  {category.name}
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {category.amenities.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={`amenity-${amenity.id}`}
                        checked={selectedAmenities.includes(amenity.id)}
                        onCheckedChange={(checked) =>
                          handleAmenityChange(amenity.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`amenity-${amenity.id}`}
                        className="cursor-pointer text-sm font-normal leading-none"
                      >
                        {amenity.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
