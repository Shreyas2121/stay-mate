import type { NotificationStatusFilter } from '../types/notifications.types'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (status: NotificationStatusFilter = 'all') =>
    [...notificationKeys.all, 'list', status] as const,
  unreadCount: [...notificationKeys.all, 'unread-count'] as const,
}
