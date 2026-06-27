import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { BackendResponse } from '@/features/auth'
import type {
  BookingEarning,
  HostEarningsSummary,
  PaginatedMoney,
  Payout,
} from '../types/money.types'

export const hostMoneyKeys = {
  all: ['host-money'] as const,
  summary: ['host-money', 'summary'] as const,
  earnings: ['host-money', 'earnings'] as const,
  payouts: ['host-money', 'payouts'] as const,
}

export function useHostEarningsSummary() {
  return useQuery({
    queryKey: hostMoneyKeys.summary,
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<HostEarningsSummary>>(
        '/payouts/host/summary',
      )
      return response.data.data
    },
  })
}

export function useHostEarnings() {
  return useQuery({
    queryKey: hostMoneyKeys.earnings,
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<PaginatedMoney<BookingEarning>>>(
        '/payouts/host/earnings',
      )
      return response.data.data
    },
  })
}

export function useHostPayoutHistory() {
  return useQuery({
    queryKey: hostMoneyKeys.payouts,
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<PaginatedMoney<Payout>>>(
        '/payouts/host/history',
      )
      return response.data.data
    },
  })
}
