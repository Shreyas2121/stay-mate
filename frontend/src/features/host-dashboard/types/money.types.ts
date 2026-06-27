export type EarningStatus = 'unpaid' | 'in_payout' | 'paid' | 'voided'
export type PayoutStatus = 'pending' | 'paid'

export interface MoneyUser {
  id: string
  name?: string | null
  email: string
}

export interface MoneyListing {
  id: string
  title: string
  locationText: string
}

export interface MoneyBooking {
  id: string
  status: string
  checkIn: string
  checkOut: string
  totalAmount: number
  serviceFee: number
  listing?: MoneyListing
  bookedByUser?: MoneyUser
}

export interface BookingEarning {
  id: string
  grossAmount: number
  platformFee: number
  hostAmount: number
  status: EarningStatus
  createdAt: string
  host?: MoneyUser
  booking?: MoneyBooking
  payout?: Payout | null
}

export interface Payout {
  id: string
  totalAmount: number
  periodStart: string
  periodEnd: string
  status: PayoutStatus
  createdAt: string
  host?: MoneyUser
  earnings?: BookingEarning[]
}

export interface PaginatedMoney<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface HostEarningsSummary {
  grossRevenue: number
  platformFees: number
  netEarnings: number
  unpaidBalance: number
  pendingCompletionAmount: number
  inPayoutAmount: number
  paidAmount: number
}

export interface AdminFinanceSummary {
  gmv: number
  guestServiceFees: number
  hostPlatformFees: number
  hostNetEarnings: number
  eligiblePayoutTotal: number
  voidedHostAmount: number
  pendingPayoutTotal: number
  paidPayoutTotal: number
  platformRevenue: number
}

export interface GeneratePayoutsResult {
  payoutsCreated: number
  earningsMoved: number
  totalAmount: number
  payouts: Payout[]
}
