import { useState } from 'react'
import { AlertTriangle, CalendarRange, Lock, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { AvailabilityBlock } from '../types/listing.types'
import {
  useCreateAvailabilityBlock,
  useDeleteAvailabilityBlock,
  useListingAvailability,
} from '../api/listings.api'

interface Props {
  listingId: string
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

export function ListingAvailabilitySection({ listingId }: Props) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const {
    data: blocks = [],
    isLoading,
    isError,
    error,
  } = useListingAvailability(listingId)
  const createBlockMutation = useCreateAvailabilityBlock()
  const deleteBlockMutation = useDeleteAvailabilityBlock()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    createBlockMutation.mutate(
      {
        listingId,
        startDate,
        endDate,
        reason,
      },
      {
        onSuccess: () => {
          setStartDate('')
          setEndDate('')
          setReason('')
        },
      },
    )
  }

  const handleDelete = (block: AvailabilityBlock) => {
    if (
      window.confirm(
        `Remove the blocked range from ${formatDate(block.startDate)} to ${formatDate(block.endDate)}?`,
      )
    ) {
      deleteBlockMutation.mutate({ listingId, blockId: block.id })
    }
  }

  return (
    <Card className="rounded-2xl border border-border bg-card/95 shadow-2xs">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <CalendarRange className="size-5 text-primary" />
          Availability Blocks
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Temporarily close selected dates without unpublishing the listing.
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Start date</span>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">End date</span>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
            </label>
          </div>

          <label className="space-y-2 text-sm block">
            <span className="font-medium text-foreground">Reason</span>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional note, e.g. maintenance, owner stay, deep cleaning"
              className="min-h-24"
            />
          </label>

          <Button type="submit" disabled={createBlockMutation.isPending}>
            <Lock className="size-4" />
            Block dates
          </Button>
        </form>

        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <div className="size-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading blocked dates...
            </span>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-destructive">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Failed to load availability</div>
                <div className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : 'An unknown error occurred.'}
                </div>
              </div>
            </div>
          </div>
        ) : blocks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
            <div className="font-medium text-foreground">No blocked dates yet</div>
            <div className="text-sm text-muted-foreground mt-1">
              Add a block when you need to temporarily close this listing.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4"
              >
                <div className="space-y-1">
                  <div className="font-medium text-foreground">
                    {formatDate(block.startDate)} to {formatDate(block.endDate)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {block.reason?.trim() || 'No reason provided'}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 self-start md:self-auto"
                  onClick={() => handleDelete(block)}
                  disabled={deleteBlockMutation.isPending}
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
