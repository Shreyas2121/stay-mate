import { useState, useRef } from 'react'
import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Sparkles, ImagePlus, X, Plus, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getAssetUrl } from '@/lib/api/urls'
import { useAmenities } from '../../api/listings.api'
import type { CreateListingForm, ListingPhoto } from '../../types/listing.types'
import type { NewPhoto } from './listing-form'
import { SortablePhoto } from './sortable-photo'

interface Props {
  register: UseFormRegister<CreateListingForm>
  setValue: UseFormSetValue<CreateListingForm>
  watch: UseFormWatch<CreateListingForm>
  photos: NewPhoto[]
  onPhotosChange: (photos: NewPhoto[]) => void
  /** Existing server photos (for edit mode) */
  existingPhotos?: ListingPhoto[]
  onDeleteExistingPhoto?: (photoId: string) => void
}

export function AmenitiesPhotosSection({
  register,
  setValue,
  watch,
  photos,
  onPhotosChange,
  existingPhotos = [],
  onDeleteExistingPhoto,
}: Props) {
  const { data: categories = [], isLoading: amenitiesLoading } = useAmenities()
  const selectedAmenityIds = watch('amenityIds')
  const customAmenities = watch('customAmenities')
  const [customInput, setCustomInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleAmenity = (id: string) => {
    const current = selectedAmenityIds || []
    const updated = current.includes(id)
      ? current.filter((a) => a !== id)
      : [...current, id]
    setValue('amenityIds', updated)
  }

  const addCustomAmenity = () => {
    const trimmed = customInput.trim()
    if (!trimmed) return
    const current = customAmenities || []
    if (!current.includes(trimmed)) {
      setValue('customAmenities', [...current, trimmed])
    }
    setCustomInput('')
  }

  const removeCustomAmenity = (name: string) => {
    const current = customAmenities || []
    setValue(
      'customAmenities',
      current.filter((a) => a !== name),
    )
  }

  const photoOrder = watch('photoOrder') || []

  // Create a unified sortable items array based on photoOrder
  const sortableItems = photoOrder
    .map((id) => {
      const existing = existingPhotos.find((p) => p.id === id)
      if (existing) return { id, url: getAssetUrl(existing.picture) }

      const newP = photos.find((p) => p.id === id)
      if (newP) return { id, url: newP.previewUrl }

      return null
    })
    .filter(Boolean) as { id: string; url: string }[]

  const totalPhotoCount = sortableItems.length

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    const maxNew = 10 - totalPhotoCount
    const allowed = newFiles.slice(0, maxNew)

    const newPhotosObjs: NewPhoto[] = allowed.map((f, i) => ({
      id: `new-${photos.length + i}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }))

    onPhotosChange([...photos, ...newPhotosObjs])
    setValue('photoOrder', [...photoOrder, ...newPhotosObjs.map((p) => p.id)])

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemovePhoto = (id: string) => {
    setValue(
      'photoOrder',
      photoOrder.filter((pid) => pid !== id),
    )

    if (id.startsWith('new-')) {
      const removed = photos.find((p) => p.id === id)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      onPhotosChange(photos.filter((p) => p.id !== id))
    } else {
      onDeleteExistingPhoto?.(id)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = photoOrder.indexOf(active.id)
      const newIndex = photoOrder.indexOf(over.id)
      setValue('photoOrder', arrayMove(photoOrder, oldIndex, newIndex))
    }
  }

  return (
    <div className="space-y-8">
      {/* ─── Amenities ─── */}
      <section className="space-y-5">
        <div className="flex items-center gap-2.5 text-foreground">
          <Sparkles className="size-5 text-primary" />
          <h3 className="text-lg font-bold">Amenities</h3>
        </div>

        {amenitiesLoading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="size-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            Loading amenities...
          </div>
        ) : (
          <div className="space-y-5">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-2.5">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {cat.name}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {cat.amenities.map((amenity) => {
                    const isSelected = selectedAmenityIds?.includes(amenity.id)
                    return (
                      <Button
                        key={amenity.id}
                        type="button"
                        variant="outline"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        {amenity.name}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Amenities */}
        <div className="space-y-2.5 pt-2">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="size-3.5" />
            Custom Amenities
          </h4>
          <div className="flex gap-2">
            <Input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomAmenity()
                }
              }}
              placeholder="e.g. Rooftop terrace"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomAmenity}
              className="gap-1 shrink-0"
            >
              <Plus className="size-3.5" /> Add
            </Button>
          </div>
          {customAmenities && customAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {customAmenities.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium border border-primary bg-primary/10 text-primary"
                >
                  {name}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomAmenity(name)}
                    className="h-5 w-5 hover:text-destructive hover:bg-destructive/10 rounded-full"
                  >
                    <X className="size-3.5" />
                  </Button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Photos ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 text-foreground">
          <ImagePlus className="size-5 text-primary" />
          <h3 className="text-lg font-bold">Photos</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {totalPhotoCount}/10
          </span>
        </div>

        {/* Upload Area */}
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-auto py-12 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/30 hover:bg-primary/5 flex flex-col items-center justify-center gap-3 transition-all"
        >
          <ImagePlus className="size-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              Click to upload photos
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              JPG, PNG, WebP — max 10MB each, up to 10 photos
            </p>
          </div>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Previews — Sortable Grid */}
        {sortableItems.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <SortableContext
                items={sortableItems.map((item) => item.id)}
                strategy={rectSortingStrategy}
              >
                {sortableItems.map((item, index) => (
                  <SortablePhoto
                    key={item.id}
                    id={item.id}
                    url={item.url}
                    isCover={index === 0}
                    onRemove={handleRemovePhoto}
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        )}
      </section>

      {/* ─── Additional Info ─── */}
      <section className="space-y-2">
        <label
          htmlFor="additionalInfo"
          className="text-sm font-semibold text-foreground"
        >
          Additional Information
        </label>
        <Textarea
          id="additionalInfo"
          rows={3}
          placeholder="House rules, parking instructions, special notes for guests..."
          className="resize-none w-full"
          {...register('additionalInfo')}
        />
      </section>
    </div>
  )
}
