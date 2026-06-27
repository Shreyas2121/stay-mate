import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, Home, Loader2, Search, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  useAdminHosts,
  useReactivateHost,
  useTerminateHost,
} from '../api/admin.api'
import type { AdminHost, AdminHostStatusFilter } from '../types/admin.types'

const TABS: Array<{ id: AdminHostStatusFilter; label: string }> = [
  { id: 'all', label: 'All Hosts' },
  { id: 'active', label: 'Active' },
  { id: 'terminated', label: 'Terminated' },
]

function HostCard({
  host,
  onTerminate,
  onReactivate,
  isPending,
}: {
  host: AdminHost
  onTerminate: (host: AdminHost) => void
  onReactivate: (host: AdminHost) => void
  isPending: boolean
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">
              {host.name || host.email}
            </h3>
            <Badge variant={host.isActive ? 'secondary' : 'destructive'}>
              {host.isActive ? 'Active' : 'Terminated'}
            </Badge>
            {host.hostProfile?.status && (
              <Badge variant="outline" className="capitalize">
                {host.hostProfile.status}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{host.email}</p>
          {host.hostProfile?.legalName && (
            <p className="mt-1 text-sm text-muted-foreground">
              Legal name: {host.hostProfile.legalName}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/hosts/$hostId" params={{ hostId: host.id }}>
              View Host
            </Link>
          </Button>
          {host.isActive ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => onTerminate(host)}
            >
              Terminate
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => onReactivate(host)}
            >
              Reactivate
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Listings
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {host.listingCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active Listings
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {host.activeListingCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Bookings
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {host.bookingCount}
          </p>
        </div>
      </div>
    </article>
  )
}

export function HostManagementPage() {
  const [activeTab, setActiveTab] = useState<AdminHostStatusFilter>('all')
  const { data: hosts = [], isLoading, isError } = useAdminHosts(activeTab)
  const terminateMutation = useTerminateHost()
  const reactivateMutation = useReactivateHost()

  const handleTerminate = (host: AdminHost) => {
    if (
      window.confirm(
        `Terminate ${host.name || host.email}? This closes their listings and cancels pending bookings.`,
      )
    ) {
      terminateMutation.mutate(host.id)
    }
  }

  const handleReactivate = (host: AdminHost) => {
    if (
      window.confirm(
        `Reactivate ${host.name || host.email}? Closed listings will stay closed.`,
      )
    ) {
      reactivateMutation.mutate(host.id)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-headline-md font-bold text-foreground">
          Host Management
        </h2>
        <p className="text-body-sm text-muted-foreground">
          Audit hosts, inspect listings, and terminate unsafe inventory without
          deleting history.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="shrink-0 rounded-xl"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading hosts...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
          <AlertTriangle className="mx-auto mb-2 size-8" />
          Failed to load hosts.
        </div>
      )}

      {hosts.length > 0 && (
        <div className="space-y-5">
          {hosts.map((host) => (
            <HostCard
              key={host.id}
              host={host}
              onTerminate={handleTerminate}
              onReactivate={handleReactivate}
              isPending={
                terminateMutation.isPending || reactivateMutation.isPending
              }
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && hosts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {activeTab === 'terminated' ? (
              <UserX className="size-8" />
            ) : (
              <Search className="size-8" />
            )}
          </div>
          <h3 className="text-lg font-bold text-foreground">No hosts found</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            There are no hosts matching this filter.
          </p>
        </div>
      )}
    </div>
  )
}
