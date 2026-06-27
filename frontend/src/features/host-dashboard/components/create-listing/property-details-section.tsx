import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import {
  FileText,
  Users,
  BedDouble,
  Bath,
  Building2,
  TreePine,
  Warehouse,
  DoorOpen,
} from 'lucide-react'
import type { CreateListingForm } from '../../types/listing.types'
import { PropertyType } from '../../types/listing.types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const PROPERTY_TYPE_OPTIONS = [
  {
    value: PropertyType.Apartment,
    label: 'Apartment',
    icon: <Building2 className="size-5" />,
  },
  {
    value: PropertyType.Villa,
    label: 'Villa',
    icon: <TreePine className="size-5" />,
  },
  {
    value: PropertyType.Cabin,
    label: 'Cabin',
    icon: <Warehouse className="size-5" />,
  },
  {
    value: PropertyType.Room,
    label: 'Room',
    icon: <DoorOpen className="size-5" />,
  },
]

interface Props {
  register: UseFormRegister<CreateListingForm>
  errors: FieldErrors<CreateListingForm>
  selectedPropertyType: string
}

export function PropertyDetailsSection({
  register,
  errors,
  selectedPropertyType,
}: Props) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2.5 text-foreground">
        <FileText className="size-5 text-primary" />
        <h3 className="text-lg font-bold">Property Details</h3>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label
          htmlFor="title"
          className="text-sm font-semibold text-foreground"
        >
          Listing Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          type="text"
          placeholder="e.g. Cozy Downtown Apartment with City Views"
          className="w-full"
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label
          htmlFor="description"
          className="text-sm font-semibold text-foreground"
        >
          Description <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Describe your property — what makes it special, nearby attractions, amenities..."
          className="resize-none w-full"
          {...register('description', { required: 'Description is required' })}
        />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">
          Property Type <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PROPERTY_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                selectedPropertyType === opt.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <input
                type="radio"
                value={opt.value}
                className="sr-only"
                {...register('propertyType', {
                  required: 'Select a property type',
                })}
              />
              {opt.icon}
              <span className="text-sm font-semibold">{opt.label}</span>
            </label>
          ))}
        </div>
        {errors.propertyType && (
          <p className="text-xs text-destructive">
            {errors.propertyType.message}
          </p>
        )}
      </div>

      {/* Capacity: Guests / Bedrooms / Bathrooms */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="maxGuests"
            className="text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <Users className="size-4 text-muted-foreground" />
            Max Guests <span className="text-destructive">*</span>
          </label>
          <Input
            id="maxGuests"
            type="number"
            min={1}
            placeholder="4"
            className="w-full"
            {...register('maxGuests', {
              required: 'Required',
              valueAsNumber: true,
              min: { value: 1, message: 'At least 1' },
            })}
          />
          {errors.maxGuests && (
            <p className="text-xs text-destructive">
              {errors.maxGuests.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="bedrooms"
            className="text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <BedDouble className="size-4 text-muted-foreground" />
            Bedrooms <span className="text-destructive">*</span>
          </label>
          <Input
            id="bedrooms"
            type="number"
            min={0}
            placeholder="2"
            className="w-full"
            {...register('bedrooms', {
              required: 'Required',
              valueAsNumber: true,
              min: { value: 0, message: 'Min 0' },
            })}
          />
          {errors.bedrooms && (
            <p className="text-xs text-destructive">
              {errors.bedrooms.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="bathrooms"
            className="text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <Bath className="size-4 text-muted-foreground" />
            Bathrooms <span className="text-destructive">*</span>
          </label>
          <Input
            id="bathrooms"
            type="number"
            min={0}
            placeholder="1"
            className="w-full"
            {...register('bathrooms', {
              required: 'Required',
              valueAsNumber: true,
              min: { value: 0, message: 'Min 0' },
            })}
          />
          {errors.bathrooms && (
            <p className="text-xs text-destructive">
              {errors.bathrooms.message}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
