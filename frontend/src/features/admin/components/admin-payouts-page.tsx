import { format } from 'date-fns'
import { Banknote, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useAdminPayouts,
  useGeneratePayouts,
  useMarkPayoutPaid,
} from '../api/admin.api'
import type { Payout, PayoutStatus } from '@/features/host-dashboard/types/money.types'

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

function statusClass(status: PayoutStatus) {
  if (status === 'paid') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
  return 'bg-amber-500/10 text-amber-700 border-amber-500/20'
}

function PayoutRow({
  payout,
  onMarkPaid,
  isPending,
}: {
  payout: Payout
  onMarkPaid: (id: string) => void
  isPending: boolean
}) {
  const earningsCount = payout.earnings?.length ?? 0

  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">
            {payout.host?.name || payout.host?.email || 'Host unavailable'}
          </h3>
          <Badge variant="outline" className={statusClass(payout.status)}>
            {PAYOUT_LABELS[payout.status]}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Amount</p>
          <p className="font-bold text-foreground">{formatMoney(payout.totalAmount)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Earnings</p>
          <p className="font-bold text-foreground">{earningsCount}</p>
        </div>
      </div>

      <div className="flex justify-end">
        {payout.status === 'pending' ? (
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={isPending}
            onClick={() => onMarkPaid(payout.id)}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Mark paid
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">Completed</span>
        )}
      </div>
    </div>
  )
}

export function AdminPayoutsPage() {
  const { data: payouts, isLoading } = useAdminPayouts()
  const generatePayouts = useGeneratePayouts()
  const markPaid = useMarkPayoutPaid()

  const payoutItems = payouts?.items ?? []
  const pendingTotal = payoutItems
    .filter((payout) => payout.status === 'pending')
    .reduce((sum, payout) => sum + Number(payout.totalAmount), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading payouts...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-headline-md font-bold text-foreground">Payouts</h2>
          <p className="text-body-sm text-muted-foreground">
            Generate payout batches from completed unpaid earnings and mark them paid manually.
          </p>
        </div>
        <Button
          type="button"
          className="gap-1.5"
          disabled={generatePayouts.isPending}
          onClick={() => generatePayouts.mutate()}
        >
          {generatePayouts.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Generate payouts
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total payouts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-bold text-foreground">
            {payoutItems.length}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending amount</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-bold text-foreground">
            {formatMoney(pendingTotal)}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground">Last generation</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            {generatePayouts.data
              ? `${generatePayouts.data.payoutsCreated} payouts, ${formatMoney(generatePayouts.data.totalAmount)}`
              : 'No batch generated this session'}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Banknote className="size-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Payout queue</h3>
        </div>

        {payoutItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
            No payouts yet. Generate payouts after hosts have completed unpaid earnings.
          </div>
        ) : (
          <div className="space-y-3">
            {payoutItems.map((payout) => (
              <PayoutRow
                key={payout.id}
                payout={payout}
                onMarkPaid={(id) => markPaid.mutate(id)}
                isPending={markPaid.isPending && markPaid.variables === payout.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
