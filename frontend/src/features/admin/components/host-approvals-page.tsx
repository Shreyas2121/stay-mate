import { useState } from 'react'
import { Check, X, Clock, Info, Search, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

import type { HostProfileTab } from '../types/admin.types'
import {
  useAdminHostProfiles,
  useApproveHost,
  useRejectHost,
} from '../api/admin.api'
import { HostProfileCard } from './host-profile-card'
import { RejectionModal } from './rejection-modal'

const TABS: { id: HostProfileTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'pending',
    label: 'Pending Review',
    icon: <Clock className="size-4" />,
  },
  { id: 'verified', label: 'Approved', icon: <Check className="size-4" /> },
  { id: 'rejected', label: 'Rejected', icon: <X className="size-4" /> },
  { id: 'all', label: 'All Profiles', icon: <Info className="size-4" /> },
]

export function HostApprovalsPage() {
  const [activeTab, setActiveTab] = useState<HostProfileTab>('pending')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const {
    data: profiles = [],
    isLoading,
    isError,
    error,
  } = useAdminHostProfiles(activeTab)
  const approveMutation = useApproveHost()
  const rejectMutation = useRejectHost()

  const handleApprove = (id: string) => {
    if (
      window.confirm('Are you sure you want to approve this host application?')
    ) {
      approveMutation.mutate(id)
    }
  }

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || !rejectId) return
    rejectMutation.mutate(
      { id: rejectId, rejectionReason: reason },
      {
        onSuccess: () => {
          setRejectId(null)
          setReason('')
        },
      },
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-headline-md font-bold text-foreground">
            Host Applications
          </h2>
          <p className="text-body-sm text-muted-foreground">
            Review and manage verification requests from guests wanting to
            become hosts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/60 flex gap-4 overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 h-auto text-sm font-semibold border-b-2 rounded-none transition-all cursor-pointer whitespace-nowrap px-1 ${
                isActive
                  ? 'border-primary text-primary hover:bg-transparent hover:text-primary'
                  : 'border-transparent text-muted-foreground hover:bg-transparent hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="size-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm text-muted-foreground">
            Loading applications...
          </span>
        </div>
      ) : isError ? (
        <div className="py-12 px-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive flex flex-col items-center justify-center text-center">
          <AlertTriangle className="size-8 mb-2" />
          <h4 className="font-bold">Failed to load applications</h4>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            {error instanceof Error
              ? error.message
              : 'An unknown error occurred.'}
          </p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="py-20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center p-6 bg-card/30">
          <div className="size-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
            <Search className="size-6" />
          </div>
          <h3 className="font-bold text-foreground">No applications found</h3>
          <p className="text-sm text-muted-foreground max-w-xs mt-1">
            There are currently no host profiles matching the selected status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {profiles.map((profile) => (
            <HostProfileCard
              key={profile.id}
              profile={profile}
              onApprove={handleApprove}
              onReject={(id) => setRejectId(id)}
              isActionPending={
                approveMutation.isPending || rejectMutation.isPending
              }
            />
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectId && (
        <RejectionModal
          reason={reason}
          onReasonChange={setReason}
          onSubmit={handleRejectSubmit}
          onCancel={() => setRejectId(null)}
          isPending={rejectMutation.isPending}
        />
      )}
    </div>
  )
}
