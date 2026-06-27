import { ImageOff } from 'lucide-react'
import type { Listing } from '../../types/listings.types'
import type { ListingPhoto } from '#/features/host-dashboard/types/listing.types'
import { imageUrl } from './utils'

export function PhotoTile({
  photo,
  listingTitle,
  className,
}: {
  photo?: ListingPhoto
  listingTitle: string
  className?: string
}) {
  const src = imageUrl(photo)

  return (
    <div className={`overflow-hidden bg-slate-100 ${className || ''}`}>
      {src ? (
        <img
          src={src}
          alt={photo?.label || listingTitle}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-slate-400">
          <ImageOff className="size-8" />
          <span className="text-sm font-medium">No photo available</span>
        </div>
      )}
    </div>
  )
}

export function PhotoGallery({ listing }: { listing: Listing }) {
  const photos = [...(listing.photos || [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  )

  if (photos.length <= 1) {
    return (
      <PhotoTile
        photo={photos[0]}
        listingTitle={listing.title}
        className="aspect-[16/9] rounded-2xl"
      />
    )
  }

  return (
    <div className="grid h-[520px] grid-cols-1 gap-2 overflow-hidden rounded-2xl md:grid-cols-4 md:grid-rows-2">
      <PhotoTile
        photo={photos[0]}
        listingTitle={listing.title}
        className="md:col-span-2 md:row-span-2"
      />
      {photos.slice(1, 5).map((photo) => (
        <PhotoTile key={photo.id} photo={photo} listingTitle={listing.title} />
      ))}
    </div>
  )
}
