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
  const [priceRange, setPriceRange] = useState<number[]>([search.minPrice || 10, search.maxPrice || 1000])
  
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(search.propertyTypes || [])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  const { data: amenityCategories, isLoading: isLoadingAmenities } = useAmenities()

  const propertyTypes = [
    { id: PropertyType.Apartment, label: 'Apartment' },
    { id: PropertyType.Villa, label: 'Villa' },
    { id: PropertyType.Cabin, label: 'Cabin' },
    { id: PropertyType.Room, label: 'Room' },
  ]

  const handlePropertyTypeChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPropertyTypes([...selectedPropertyTypes, id])
    } else {
      setSelectedPropertyTypes(selectedPropertyTypes.filter((t) => t !== id))
    }
  }

  const handleAmenityChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities([...selectedAmenities, id])
    } else {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== id))
    }
  }

  // Sync state to URL with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          range: radius[0] !== 50 ? radius[0] : undefined,
          minPrice: priceRange[0] !== 10 ? priceRange[0] : undefined,
          maxPrice: priceRange[1] !== 1000 ? priceRange[1] : undefined,
          propertyTypes: selectedPropertyTypes.length > 0 ? selectedPropertyTypes : undefined,
          page: 1, // Reset to page 1 on filter change
        }),
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [radius, priceRange, selectedPropertyTypes, selectedAmenities, navigate])

  return (
    <div className="w-full space-y-6">
      
      {/* Distance Radius */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
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

      {/* Price Range */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-semibold">Price Range</Label>
          <span className="text-sm text-muted-foreground">${priceRange[0]} - ${priceRange[1]}</span>
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input 
                type="number" 
                value={priceRange[0]} 
                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="pl-7 bg-background"
              />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Max price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input 
                type="number" 
                value={priceRange[1]} 
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                className="pl-7 bg-background"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Property Type */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Property Type</Label>
        <div className="space-y-3">
          {propertyTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-3">
              <Checkbox 
                id={`property-${type.id}`} 
                checked={selectedPropertyTypes.includes(type.id)}
                onCheckedChange={(checked) => handlePropertyTypeChange(type.id, checked as boolean)}
              />
              <Label htmlFor={`property-${type.id}`} className="font-normal text-sm leading-none cursor-pointer">
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Amenities */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Amenities</Label>
        {isLoadingAmenities ? (
          <div className="flex items-center space-x-2 text-muted-foreground py-4">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Loading amenities...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {amenityCategories?.map((category) => (
              <div key={category.id} className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700">{category.name}</h4>
                <div className="grid grid-cols-1 gap-3">
                  {category.amenities.map((amenity) => (
                    <div key={amenity.id} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`amenity-${amenity.id}`}
                        checked={selectedAmenities.includes(amenity.id)}
                        onCheckedChange={(checked) => handleAmenityChange(amenity.id, checked as boolean)}
                      />
                      <Label htmlFor={`amenity-${amenity.id}`} className="font-normal text-sm leading-none cursor-pointer">
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
