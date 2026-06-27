import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { BackendResponse } from '@/features/auth'
import type {
  Notification,
  NotificationStatusFilter,
  PaginatedNotifications,
  UnreadNotificationCount,
} from '../types/notifications.types'
import { notificationKeys } from './notifications.keys'

export function useNotifications(status: NotificationStatusFilter = 'all') {
  return useQuery({
    queryKey: notificationKeys.list(status),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<PaginatedNotifications>>(
        '/notifications',
        { params: { status, page: 1, limit: 10 } },
      )
      return response.data.data
    },
    refetchInterval: 30_000,
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<UnreadNotificationCount>>(
        '/notifications/unread-count',
      )
      return response.data.data
    },
    refetchInterval: 30_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.patch<BackendResponse<Notification>>(
        `/notifications/${notificationId}/read`,
      )
      return response.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch<BackendResponse<{ updatedCount: number }>>(
        '/notifications/read-all',
      )
      return response.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
