import { format } from 'date-fns'
import { Banknote, Clock, CreditCard, DollarSign, Loader2, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useHostEarnings,
  useHostEarningsSummary,
  useHostPayoutHistory,
} from '../api/earnings.api'
import type { BookingEarning, EarningStatus, PayoutStatus } from '../types/money.types'

const EARNING_LABELS: Record<EarningStatus, string> = {
  unpaid: 'Unpaid',
  in_payout: 'In payout',
  paid: 'Paid',
  voided: 'Voided',
}

const PAYOUT_LABELS: Record<PayoutStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatDate(value?: string) {
  if (!value) return 'Unavailable'
  return format(new Date(value), 'MMM d, yyyy')
}

function statusClass(status: EarningStatus | PayoutStatus) {
  if (status === 'paid') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
  if (status === 'pending' || status === 'unpaid') return 'bg-amber-500/10 text-amber-700 border-amber-500/20'
  if (status === 'in_payout') return 'bg-blue-500/10 text-blue-700 border-blue-500/20'
  return 'bg-muted text-muted-foreground border-border'
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl border border-border/70 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{formatMoney(value)}</div>
      </CardContent>
    </Card>
  )
}

function EarningsTable({ earnings }: { earnings: BookingEarning[] }) {
  if (earnings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
        Earnings will appear after guests complete checkout.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Booking</th>
              <th className="px-4 py-3 text-left">Guest</th>
              <th className="px-4 py-3 text-right">Gross</th>
              <th className="px-4 py-3 text-right">Fee</th>
              <th className="px-4 py-3 text-right">Net</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {earnings.map((earning) => (
              <tr key={earning.id}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-foreground">
                    {earning.booking?.listing?.title ?? 'Listing unavailable'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(earning.booking?.checkIn)} - {formatDate(earning.booking?.checkOut)}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {earning.booking?.bookedByUser?.name ||
                    earning.booking?.bookedByUser?.email ||
                    'Unavailable'}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatMoney(earning.grossAmount)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {formatMoney(earning.platformFee)}
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatMoney(earning.hostAmount)}
                </td>
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

export function HostEarningsPage() {
  const { data: summary, isLoading: isSummaryLoading } = useHostEarningsSummary()
  const { data: earnings, isLoading: isEarningsLoading } = useHostEarnings()
  const { data: payouts, isLoading: isPayoutsLoading } = useHostPayoutHistory()

  const isLoading = isSummaryLoading || isEarningsLoading || isPayoutsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading earnings...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-headline-md font-bold text-foreground">Earnings</h2>
        <p className="text-body-sm text-muted-foreground">
          Track booking earnings, platform fees, unpaid balance, and payout history.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard title="Gross revenue" value={summary?.grossRevenue ?? 0} icon={<DollarSign className="size-5" />} />
        <SummaryCard title="Net earnings" value={summary?.netEarnings ?? 0} icon={<Wallet className="size-5" />} />
        <SummaryCard title="Ready for payout" value={summary?.unpaidBalance ?? 0} icon={<Banknote className="size-5" />} />
        <SummaryCard title="Pending completion" value={summary?.pendingCompletionAmount ?? 0} icon={<Clock className="size-5" />} />
        <SummaryCard title="In payout" value={summary?.inPayoutAmount ?? 0} icon={<CreditCard className="size-5" />} />
        <SummaryCard title="Paid out" value={summary?.paidAmount ?? 0} icon={<Banknote className="size-5" />} />
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Booking earnings</h3>
          <p className="text-sm text-muted-foreground">
            Each paid booking creates one earning row with StayMate's 2% host fee deducted.
          </p>
        </div>
        <EarningsTable earnings={earnings?.items ?? []} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Payout history</h3>
          <p className="text-sm text-muted-foreground">
            Admin-generated payout batches grouped by host.
          </p>
        </div>
        <div className="grid gap-3">
          {(payouts?.items ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center text-sm text-muted-foreground">
              No payouts generated yet.
            </div>
          ) : (
            payouts?.items.map((payout) => (
              <div key={payout.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-foreground">{formatMoney(payout.totalAmount)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                  </div>
                </div>
                <Badge variant="outline" className={statusClass(payout.status)}>
                  {PAYOUT_LABELS[payout.status]}
                </Badge>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
