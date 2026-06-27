import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StarRatingInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function StarRatingInput({
  value,
  onChange,
  disabled,
}: StarRatingInputProps) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((rating) => {
        const isSelected = rating <= value
        return (
          <Button
            key={rating}
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
            aria-checked={value === rating}
            role="radio"
            className="text-amber-500 hover:bg-amber-500/10 hover:text-amber-600"
            onClick={() => onChange(rating)}
          >
            <Star
              className={isSelected ? 'size-5 fill-current' : 'size-5'}
            />
          </Button>
        )
      })}
    </div>
  )
}
