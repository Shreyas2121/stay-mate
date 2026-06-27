import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Save, Globe, RefreshCw, AlertCircle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'

import type { CreateListingForm, ListingPhoto } from '../../types/listing.types'
import { ListingStatus } from '../../types/listing.types'

import { PropertyDetailsSection } from './property-details-section'
import { LocationPicker } from './location-picker'
import { PricingRulesSection } from './pricing-rules-section'
import { AmenitiesPhotosSection } from './amenities-photos-section'

export type ListingFormMode = 'create' | 'edit-draft' | 'edit-active'

interface ListingFormProps {
  mode: ListingFormMode
  defaultValues: CreateListingForm
  /** Existing photos from server (for edit mode) */
  existingPhotos?: ListingPhoto[]
  /** Called on form submit */
  onSubmit: (
    data: CreateListingForm,
    status: ListingStatus,
    newPhotos: File[],
    deletedPhotoIds: string[],
  ) => void
  isPending: boolean
  error: Error | null
}

export interface NewPhoto {
  id: string
  file: File
  previewUrl: string
}

export function ListingForm({
  mode,
  defaultValues,
  existingPhotos = [],
  onSubmit,
  isPending,
  error,
}: ListingFormProps) {
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([])
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateListingForm>({
    defaultValues,
    mode: 'onSubmit',
  })

  const selectedPropertyType = watch('propertyType')
  const latitude = watch('latitude')
  const longitude = watch('longitude')
  const locationText = watch('locationText')
  const photoOrder = watch('photoOrder') || []

  const locationError =
    errors.locationText?.message ||
    errors.latitude?.message ||
    errors.longitude?.message ||
    undefined

  // Initialize photoOrder if editing and not set
  useEffect(() => {
    if (
      mode !== 'create' &&
      photoOrder.length === 0 &&
      existingPhotos.length > 0 &&
      deletedPhotoIds.length === 0
    ) {
      setValue(
        'photoOrder',
        existingPhotos.map((p) => p.id),
      )
    }
  }, [
    mode,
    existingPhotos,
    photoOrder.length,
    deletedPhotoIds.length,
    setValue,
  ])

  // Photos that haven't been marked for deletion
  const visibleExistingPhotos = existingPhotos.filter(
    (p) => !deletedPhotoIds.includes(p.id),
  )

  const handleDeleteExistingPhoto = (photoId: string) => {
    setDeletedPhotoIds((prev) => [...prev, photoId])
    setValue(
      'photoOrder',
      photoOrder.filter((id) => id !== photoId),
    )
  }

  const submitHandler = (data: CreateListingForm, status: ListingStatus) => {
    // Pass raw files to parent
    onSubmit(
      data,
      status,
      newPhotos.map((p) => p.file),
      deletedPhotoIds,
    )
  }

  return (
    <>
      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm text-destructive-foreground">
            <p className="font-semibold text-foreground">
              {mode === 'create'
                ? 'Failed to create listing'
                : 'Failed to update listing'}
            </p>
            <p className="mt-1">
              {(error as any)?.response?.data?.message ||
                error.message ||
                'An error occurred. Please try again.'}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit((data) =>
          submitHandler(data, ListingStatus.Active),
        )}
        noValidate
        className="space-y-10"
      >
        {/* Section 1 — Property Details */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <PropertyDetailsSection
            register={register}
            errors={errors}
            selectedPropertyType={selectedPropertyType}
          />
        </div>

        {/* Section 2 — Location */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <LocationPicker
            setValue={setValue}
            latitude={latitude}
            longitude={longitude}
            locationText={locationText}
            error={locationError}
          />
          <input
            type="hidden"
            {...register('locationText', { required: 'Location is required' })}
          />
          <input
            type="hidden"
            {...register('latitude', { required: 'Pin a location on the map' })}
          />
          <input
            type="hidden"
            {...register('longitude', {
              required: 'Pin a location on the map',
            })}
          />
        </div>

        {/* Section 3 — Pricing & Rules */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <PricingRulesSection register={register} errors={errors} />
        </div>

        {/* Section 4 — Amenities & Photos */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <AmenitiesPhotosSection
            register={register}
            setValue={setValue}
            watch={watch}
            photos={newPhotos}
            onPhotosChange={setNewPhotos}
            existingPhotos={visibleExistingPhotos}
            onDeleteExistingPhoto={handleDeleteExistingPhoto}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-border">
          {/* Draft button — shown for create and edit-draft modes */}
          {(mode === 'create' || mode === 'edit-draft') && (
            <Button
              type="button"
              variant="outline"
              className="gap-1.5 order-2 sm:order-1"
              disabled={isPending}
              onClick={handleSubmit((data) =>
                submitHandler(data, ListingStatus.Draft),
              )}
            >
              {isPending ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save as Draft
            </Button>
          )}

          {/* Primary action */}
          <Button
            type="submit"
            className="gap-1.5 order-1 sm:order-2"
            disabled={isPending}
          >
            {isPending ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : mode === 'edit-active' ? (
              <Pencil className="size-4" />
            ) : (
              <Globe className="size-4" />
            )}
            {mode === 'edit-active' ? 'Update Listing' : 'Publish Listing'}
          </Button>
        </div>
      </form>
    </>
  )
}
