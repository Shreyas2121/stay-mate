import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { BackendResponse } from '@/features/auth'
import type { Booking } from '@/features/bookings'
import type {
  AdminFinanceSummary,
  BookingEarning,
  GeneratePayoutsResult,
  PaginatedMoney,
  Payout,
} from '@/features/host-dashboard/types/money.types'
import type { Listing } from '@/features/host-dashboard/types/listing.types'
import type {
  AdminHost,
  AdminHostStatusFilter,
  Coupon,
  CouponFormValues,
  HostProfile,
  HostProfileTab,
} from '../types/admin.types'
import { adminKeys } from './admin.keys'

export function useAdminHostProfiles(activeTab: HostProfileTab) {
  return useQuery({
    queryKey: adminKeys.hostProfilesTab(activeTab),
    queryFn: async () => {
      const url =
        activeTab === 'all'
          ? '/admin/host-profiles'
          : `/admin/host-profiles?status=${activeTab}`
      const response = await apiClient.get<BackendResponse<HostProfile[]>>(url)
      return response.data.data
    },
  })
}

export function useAdminHosts(status: AdminHostStatusFilter) {
  return useQuery({
    queryKey: adminKeys.hosts(status),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<AdminHost[]>>(
        '/admin/hosts',
        { params: { status } },
      )
      return response.data.data
    },
  })
}

export function useAdminHost(hostId: string) {
  return useQuery({
    queryKey: adminKeys.host(hostId),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<AdminHost>>(
        `/admin/hosts/${hostId}`,
      )
      return response.data.data
    },
    enabled: Boolean(hostId),
  })
}

export function useAdminHostListings(hostId: string) {
  return useQuery({
    queryKey: adminKeys.hostListings(hostId),
    queryFn: async () => {
      const response = await apiClient.get<
        BackendResponse<Array<Listing & { bookingCount?: number }>>
      >(`/admin/hosts/${hostId}/listings`)
      return response.data.data
    },
    enabled: Boolean(hostId),
  })
}

export function useAdminListing(listingId: string) {
  return useQuery({
    queryKey: adminKeys.listing(listingId),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<Listing>>(
        `/admin/listings/${listingId}`,
      )
      return response.data.data
    },
    enabled: Boolean(listingId),
  })
}

export function useAdminListingBookings(listingId: string) {
  return useQuery({
    queryKey: adminKeys.listingBookings(listingId),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<Booking[]>>(
        `/admin/listings/${listingId}/bookings`,
      )
      return response.data.data
    },
    enabled: Boolean(listingId),
  })
}

export function useTerminateHost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (hostId: string) => {
      const response = await apiClient.patch<
        BackendResponse<{
          hostId: string
          isActive: boolean
          closedListings: number
          cancelledPendingBookings: number
        }>
      >(`/admin/hosts/${hostId}/terminate`)
      return response.data.data
    },
    onSuccess: (_, hostId) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all })
      void queryClient.invalidateQueries({ queryKey: adminKeys.host(hostId) })
    },
  })
}

export function useReactivateHost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (hostId: string) => {
      const response = await apiClient.patch<BackendResponse<AdminHost>>(
        `/admin/hosts/${hostId}/reactivate`,
      )
      return response.data.data
    },
    onSuccess: (_, hostId) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all })
      void queryClient.invalidateQueries({ queryKey: adminKeys.host(hostId) })
    },
  })
}

export function useApproveHost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/admin/host-profiles/${id}/approve`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminKeys.hostProfiles,
      })
    },
  })
}

export function useRejectHost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      rejectionReason,
    }: {
      id: string
      rejectionReason: string
    }) => {
      await apiClient.patch(`/admin/host-profiles/${id}/reject`, {
        rejectionReason,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminKeys.hostProfiles,
      })
    },
  })
}

function mapCouponPayload(values: CouponFormValues) {
  return {
    code: values.code.trim(),
    discountType: values.discountType,
    discount: Number(values.discount),
    expiryDate: values.expiryDate ? new Date(values.expiryDate).toISOString() : undefined,
    userId: values.userId.trim() || undefined,
    isPublic: values.isPublic,
  }
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: adminKeys.coupons,
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<Coupon[]>>('/coupons/admin')
      return response.data.data
    },
  })
}

export function useCreateCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: CouponFormValues) => {
      const response = await apiClient.post<BackendResponse<Coupon>>(
        '/coupons/admin',
        mapCouponPayload(values),
      )
      return response.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.coupons })
    },
  })
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: CouponFormValues
    }) => {
      const response = await apiClient.patch<BackendResponse<Coupon>>(
        `/coupons/admin/${id}`,
        mapCouponPayload(values),
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.coupons })
      void queryClient.invalidateQueries({
        queryKey: adminKeys.coupon(variables.id),
      })
    },
  })
}

export function useDeactivateCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch<BackendResponse<Coupon>>(
        `/coupons/admin/${id}/deactivate`,
      )
      return response.data.data
    },
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.coupons })
      void queryClient.invalidateQueries({ queryKey: adminKeys.coupon(id) })
    },
  })
}

export function useAdminFinanceSummary() {
  return useQuery({
    queryKey: adminKeys.financeSummary,
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<AdminFinanceSummary>>(
        '/admin/finance/summary',
      )
      return response.data.data
    },
  })
}

export function useAdminFinanceEarnings() {
  return useQuery({
    queryKey: adminKeys.financeEarnings,
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<PaginatedMoney<BookingEarning>>>(
        '/admin/finance/earnings',
      )
      return response.data.data
    },
  })
}

export function useAdminPayouts() {
  return useQuery({
    queryKey: adminKeys.payouts,
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<PaginatedMoney<Payout>>>(
        '/admin/payouts',
      )
      return response.data.data
    },
  })
}

export function useGeneratePayouts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<BackendResponse<GeneratePayoutsResult>>(
        '/admin/payouts/generate',
      )
      return response.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.financeSummary })
      void queryClient.invalidateQueries({ queryKey: adminKeys.financeEarnings })
      void queryClient.invalidateQueries({ queryKey: adminKeys.payouts })
    },
  })
}

export function useMarkPayoutPaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payoutId: string) => {
      const response = await apiClient.patch<BackendResponse<Payout>>(
        `/admin/payouts/${payoutId}/mark-paid`,
      )
      return response.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.financeSummary })
      void queryClient.invalidateQueries({ queryKey: adminKeys.financeEarnings })
      void queryClient.invalidateQueries({ queryKey: adminKeys.payouts })
    },
  })
}
