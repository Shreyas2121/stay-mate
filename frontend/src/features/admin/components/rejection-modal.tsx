import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface RejectionModalProps {
  reason: string
  onReasonChange: (reason: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isPending: boolean
}

export function RejectionModal({
  reason,
  onReasonChange,
  onSubmit,
  onCancel,
  isPending,
}: RejectionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onCancel}
      />

      {/* Modal Panel */}
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-foreground">
          Reject Application
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Provide a clear reason explaining why this onboarding application was
          rejected. The applicant will see this reason and be able to resubmit.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="rejection-reason"
              className="text-xs font-semibold text-foreground block mb-1.5"
            >
              Reason for Rejection
            </label>
            <Textarea
              id="rejection-reason"
              rows={4}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="e.g. The uploaded government ID is expired or does not match the name provided."
              className="resize-none w-full mt-1.5"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
              className="border-border text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !reason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Rejecting...' : 'Submit Rejection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
