import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SortablePhotoProps {
  id: string
  url: string
  isCover: boolean
  onRemove: (id: string) => void
}

export function SortablePhoto({
  id,
  url,
  isCover,
  onRemove,
}: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-xl overflow-hidden border aspect-[4/3] ${
        isDragging
          ? 'border-primary ring-2 ring-primary/20 shadow-lg'
          : 'border-border'
      }`}
    >
      <img
        src={url}
        alt="Listing photo"
        className="w-full h-full object-cover"
      />

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1.5 rounded-md bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-black/60"
      >
        <GripVertical className="size-4" />
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(id)
        }}
        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
      >
        <X className="size-4" />
      </Button>

      {/* Cover Badge */}
      {isCover && (
        <Badge className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wider shadow-sm">
          Cover
        </Badge>
      )}
    </div>
  )
}
