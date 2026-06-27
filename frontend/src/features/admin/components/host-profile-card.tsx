import {
  Phone,
  MapPin,
  IdCard,
  CreditCard,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { HostProfile } from '../types/admin.types'

interface HostProfileCardProps {
  profile: HostProfile
  onApprove: (id: string) => void
  onReject: (id: string) => void
  isActionPending: boolean
}

export function HostProfileCard({
  profile,
  onApprove,
  onReject,
  isActionPending,
}: HostProfileCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
      <div className="space-y-4">
        {/* Profile Header */}
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              {(profile.legalName || 'H')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground truncate max-w-[180px]">
                {profile.legalName}
              </h3>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                {profile.user?.email || 'No email'}
              </p>
            </div>
          </div>

          {/* Badge */}
          <span
            className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase ${
              profile.status === 'verified'
                ? 'bg-success/10 text-success'
                : profile.status === 'rejected'
                  ? 'bg-error/10 text-error'
                  : 'bg-warning/10 text-warning'
            }`}
          >
            {profile.status}
          </span>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Phone className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-muted-foreground block">
                Phone
              </span>
              <span className="text-foreground">{profile.phone}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <IdCard className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-muted-foreground block">
                Identity
              </span>
              <span className="text-foreground capitalize">
                {profile.idType.replace('_', ' ')}: {profile.idNumber}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 sm:col-span-2">
            <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-muted-foreground block">
                Address
              </span>
              <span className="text-foreground leading-normal">
                {profile.address}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 sm:col-span-2">
            <CreditCard className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-muted-foreground block">
                Bank Info
              </span>
              <span className="text-foreground leading-normal whitespace-pre-wrap">
                {profile.bankInfo}
              </span>
            </div>
          </div>

          {profile.status === 'rejected' && profile.rejectionReason && (
            <div className="flex items-start gap-2.5 sm:col-span-2 rounded-xl bg-destructive/5 border border-destructive/10 p-3 mt-1">
              <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-destructive-foreground">
                <span className="font-bold block">Rejection Reason</span>
                <span>{profile.rejectionReason}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {profile.status === 'pending' && (
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/60">
          <Button
            onClick={() => onApprove(profile.id)}
            disabled={isActionPending}
            className="flex-1 gap-1.5 bg-[#10b981] hover:bg-[#0d9488] text-white shadow-sm"
          >
            <Check className="size-4" />
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => onReject(profile.id)}
            disabled={isActionPending}
            className="flex-1 gap-1.5 border-border hover:bg-destructive/10 hover:text-destructive text-foreground"
          >
            <X className="size-4" />
            Reject
          </Button>
        </div>
      )}
    </div>
  )
}
