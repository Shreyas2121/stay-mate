import { useState } from 'react'
import { Loader2, MessageSquarePlus, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateReview } from '../api/reviews.api'
import { StarRatingInput } from './star-rating-input'

interface ReviewDialogProps {
  bookingId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectLabel: string
}

export function ReviewDialog({
  bookingId,
  open,
  onOpenChange,
  subjectLabel,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const createReview = useCreateReview()

  const resetForm = () => {
    setRating(0)
    setComment('')
  }

  const handleSubmit = () => {
    if (!rating) {
      toast.error('Choose a star rating before submitting.')
      return
    }

    createReview.mutate(
      {
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Review submitted.')
          onOpenChange(false)
          resetForm()
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.error?.message ??
              'Could not submit the review. Please try again.',
          )
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen && !createReview.isPending) resetForm()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageSquarePlus className="size-5 text-primary" />
            Review {subjectLabel}
          </DialogTitle>
          <DialogDescription>
            Share a rating and optional note for this completed stay.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRatingInput
              value={rating}
              onChange={setRating}
              disabled={createReview.isPending}
            />
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3.5 text-amber-500" />
              {rating ? `${rating} out of 5` : 'Select a rating'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`review-comment-${bookingId}`}>Comment</Label>
            <Textarea
              id={`review-comment-${bookingId}`}
              value={comment}
              maxLength={1000}
              rows={5}
              disabled={createReview.isPending}
              placeholder="What should they know about this stay?"
              onChange={(event) => setComment(event.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {comment.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={createReview.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!rating || createReview.isPending}
            onClick={handleSubmit}
          >
            {createReview.isPending && <Loader2 className="size-4 animate-spin" />}
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
