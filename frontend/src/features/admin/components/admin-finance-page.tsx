import { format } from 'date-fns'
import { Banknote, DollarSign, Loader2, Receipt, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminFinanceEarnings, useAdminFinanceSummary } from '../api/admin.api'
import type { BookingEarning, EarningStatus } from '@/features/host-dashboard/types/money.types'

const EARNING_LABELS: Record<EarningStatus, string> = {
  unpaid: 'Unpaid',
  in_payout: 'In payout',
  paid: 'Paid',
  voided: 'Voided',
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatDate(value?: string) {
  if (!value) return 'Unavailable'
  return format(new Date(value), 'MMM d, yyyy')
}

function statusClass(status: EarningStatus) {
  if (status === 'paid') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
  if (status === 'unpaid') return 'bg-amber-500/10 text-amber-700 border-amber-500/20'
  if (status === 'in_payout') return 'bg-blue-500/10 text-blue-700 border-blue-500/20'
  return 'bg-muted text-muted-foreground border-border'
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border border-border/70 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{formatMoney(value)}</div>
      </CardContent>
    </Card>
  )
}

function EarningsLedger({ earnings }: { earnings: BookingEarning[] }) {
  if (earnings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
        No earnings found yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Host</th>
              <th className="px-4 py-3 text-left">Booking</th>
              <th className="px-4 py-3 text-right">Gross</th>
              <th className="px-4 py-3 text-right">Platform fee</th>
              <th className="px-4 py-3 text-right">Host net</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {earnings.map((earning) => (
              <tr key={earning.id}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-foreground">
                    {earning.host?.name || earning.host?.email || 'Unavailable'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-foreground">
                    {earning.booking?.listing?.title ?? 'Listing unavailable'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(earning.booking?.checkIn)} - {formatDate(earning.booking?.checkOut)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatMoney(earning.grossAmount)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatMoney(earning.platformFee)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatMoney(earning.hostAmount)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={statusClass(earning.status)}>
                    {EARNING_LABELS[earning.status]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminFinancePage() {
  const { data: summary, isLoading: isSummaryLoading } = useAdminFinanceSummary()
  const { data: earnings, isLoading: isEarningsLoading } = useAdminFinanceEarnings()

  if (isSummaryLoading || isEarningsLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading finance data...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-headline-md font-bold text-foreground">Finance</h2>
        <p className="text-body-sm text-muted-foreground">
          Platform revenue, host payable balances, and all booking earnings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard title="GMV" value={summary?.gmv ?? 0} icon={<DollarSign className="size-5" />} />
        <SummaryCard title="Platform revenue" value={summary?.platformRevenue ?? 0} icon={<Receipt className="size-5" />} />
        <SummaryCard title="Host net earnings" value={summary?.hostNetEarnings ?? 0} icon={<Wallet className="size-5" />} />
        <SummaryCard title="Guest service fees" value={summary?.guestServiceFees ?? 0} icon={<Receipt className="size-5" />} />
        <SummaryCard title="Host platform fees" value={summary?.hostPlatformFees ?? 0} icon={<Receipt className="size-5" />} />
        <SummaryCard title="Ready for payout" value={summary?.eligiblePayoutTotal ?? 0} icon={<Banknote className="size-5" />} />
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Earnings ledger</h3>
          <p className="text-sm text-muted-foreground">
            All host earning rows generated from paid bookings.
          </p>
        </div>
        <EarningsLedger earnings={earnings?.items ?? []} />
      </section>
    </div>
  )
}
